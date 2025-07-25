import debounce from "lodash.debounce";
import { event as gaEvent } from "nextjs-google-analytics";
import { toast } from "react-hot-toast";
import { create } from "zustand";
import { FileFormat } from "../enums/file.enum";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";
import { isIframe } from "../lib/utils/helpers";
import { contentToJson, jsonToContent } from "../lib/utils/jsonAdapter";
import useConfig from "./useConfig";
import useJson from "./useJson";

const defaultJson = JSON.stringify(
  {
    fruit: {
      name: "Apple",
      color: "Red",
      weight: "150g"
    },
    car: {
      model: "Model S",
      year: 2022,
      brand: "Tesla"
    },
    person: {
      name: "Alice",
      occupation: "Engineer",
      age: 30
    }
  },
  null,
  2
);

type SetContents = {
  contents?: string;
  hasChanges?: boolean;
  skipUpdate?: boolean;
  format?: FileFormat;
};

type Query = string | string[] | undefined;

interface JsonActions {
  getContents: () => string;
  getFormat: () => FileFormat;
  getHasChanges: () => boolean;
  setError: (error: string | null) => void;
  setHasChanges: (hasChanges: boolean) => void;
  setContents: (data: SetContents) => void;
  fetchUrl: (url: string) => void;
  setFormat: (format: FileFormat) => void;
  clear: () => void;
  setFile: (fileData: File) => void;
  setJsonSchema: (jsonSchema: object | null) => void;
  checkEditorSession: (url: Query, widget?: boolean) => void;
  updateNodeValue: (path: string, newValue: string) => void;
}

export type File = {
  id: string;
  views: number;
  owner_email: string;
  name: string;
  content: string;
  private: boolean;
  format: FileFormat;
  created_at: string;
  updated_at: string;
};

const initialStates = {
  fileData: null as File | null,
  format: FileFormat.JSON,
  contents: defaultJson,
  error: null as any,
  hasChanges: false,
  jsonSchema: null as object | null,
};

export type FileStates = typeof initialStates;

const isURL = (value: string) => {
  return /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi.test(
    value
  );
};

const debouncedUpdateJson = debounce((value: unknown) => {
  useGraph.getState().setLoading(true);
  useJson.getState().setJson(JSON.stringify(value, null, 2));
}, 800);

const useFile = create<FileStates & JsonActions>()((set, get) => ({
  ...initialStates,
  clear: () => {
    set({ contents: "" });
    useJson.getState().clear();
  },
  setJsonSchema: jsonSchema => set({ jsonSchema }),
  setFile: fileData => {
    set({ fileData, format: fileData.format || FileFormat.JSON });
    get().setContents({ contents: fileData.content, hasChanges: false });
    gaEvent("set_content", { label: fileData.format });
  },
  getContents: () => get().contents,
  getFormat: () => get().format,
  getHasChanges: () => get().hasChanges,
  setFormat: async format => {
    try {
      const prevFormat = get().format;

      set({ format });
      const contentJson = await contentToJson(get().contents, prevFormat);
      const jsonContent = await jsonToContent(JSON.stringify(contentJson, null, 2), format);

      get().setContents({ contents: jsonContent });
    } catch (error) {
      get().clear();
      console.warn("The content was unable to be converted, so it was cleared instead.");
    }
  },
  setContents: async ({ contents, hasChanges = true, skipUpdate = false, format }) => {
    try {
      set({
        ...(contents && { contents }),
        error: null,
        hasChanges,
        format: format ?? get().format,
      });

      const isFetchURL = window.location.href.includes("?");
      const json = await contentToJson(get().contents, get().format);

      if (!useConfig.getState().liveTransformEnabled && skipUpdate) return;

      if (get().hasChanges && contents && contents.length < 80_000 && !isIframe() && !isFetchURL) {
        sessionStorage.setItem("content", contents);
        sessionStorage.setItem("format", get().format);
        set({ hasChanges: true });
      }

      debouncedUpdateJson(json);
    } catch (error: any) {
      if (error?.mark?.snippet) return set({ error: error.mark.snippet });
      if (error?.message) set({ error: error.message });
      useJson.setState({ loading: false });
      useGraph.setState({ loading: false });
    }
  },
  setError: error => set({ error }),
  setHasChanges: hasChanges => set({ hasChanges }),
  fetchUrl: async url => {
    try {
      const res = await fetch(url);
      const json = await res.json();
      const jsonStr = JSON.stringify(json, null, 2);

      get().setContents({ contents: jsonStr });
      return useJson.setState({ json: jsonStr, loading: false });
    } catch (error) {
      get().clear();
      toast.error("Failed to fetch document from URL!");
    }
  },
  checkEditorSession: (url, widget) => {
    if (url && typeof url === "string" && isURL(url)) {
      return get().fetchUrl(url);
    }

    let contents = defaultJson;
    const sessionContent = sessionStorage.getItem("content") as string | null;
    const format = sessionStorage.getItem("format") as FileFormat | null;
    if (sessionContent && !widget) contents = sessionContent;

    if (format) set({ format });
    get().setContents({ contents, hasChanges: false });
  },
  updateNodeValue: (path, newValue) => {
    try {
      console.log('Updating node value:', { path, newValue });
      const currentJson = JSON.parse(get().contents);
      
      // Parse the path to navigate the JSON object
      // Remove {Root} or Root[x] prefix and handle the path
      let cleanPath = path.replace(/^\{?Root\}?(\[\d+\])?\.?/, '');
      console.log('Clean path:', cleanPath);
      
      if (cleanPath === '') {
        // Replacing the entire root value
        const updatedJson = parseValue(newValue);
        const updatedContents = JSON.stringify(updatedJson, null, 2);
        get().setContents({ contents: updatedContents });
        return;
      }
      
      if (cleanPath.startsWith('[') && cleanPath.includes(']')) {
        // Handle array root case
        const arrayIndex = parseInt(cleanPath.match(/\[(\d+)\]/)?.[1] || '0');
        cleanPath = cleanPath.replace(/^\[\d+\]\.?/, '');
        
        if (Array.isArray(currentJson)) {
          if (cleanPath) {
            setValueAtPath(currentJson[arrayIndex], cleanPath, parseValue(newValue));
          } else {
            currentJson[arrayIndex] = parseValue(newValue);
          }
        }
      } else {
        // Handle object root case
        setValueAtPath(currentJson, cleanPath, parseValue(newValue));
      }
      
      const updatedContents = JSON.stringify(currentJson, null, 2);
      console.log('Updated contents:', updatedContents);
      get().setContents({ contents: updatedContents });
    } catch (error) {
      console.error('Error updating node value:', error);
      toast.error('Failed to update node value');
    }
  },
}));

// Helper function to set value at a given path
function setValueAtPath(obj: any, path: string, value: any) {
  console.log('setValueAtPath called with:', { obj, path, value });
  
  if (!path) {
    throw new Error('Path is empty');
  }
  
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      if (current[key] && Array.isArray(current[key])) {
        current = current[key][parseInt(index)];
      } else {
        throw new Error(`Invalid array access: ${key}[${index}]`);
      }
    } else {
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        throw new Error(`Property ${part} not found`);
      }
    }
  }
  
  const lastPart = parts[parts.length - 1];
  const arrayMatch = lastPart.match(/^(.+)\[(\d+)\]$/);
  
  if (arrayMatch) {
    const [, key, index] = arrayMatch;
    if (current[key] && Array.isArray(current[key])) {
      current[key][parseInt(index)] = value;
    } else {
      throw new Error(`Invalid array access: ${key}[${index}]`);
    }
  } else {
    current[lastPart] = value;
  }
  
  console.log('Successfully updated value');
}

// Helper function to parse the new value (try to maintain type)
function parseValue(value: string): any {
  if (value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'undefined') return undefined;
  
  // Try to parse as number
  const numValue = Number(value);
  if (!isNaN(numValue) && isFinite(numValue) && value.trim() !== '') {
    return numValue;
  }
  
  // Try to parse as JSON (for objects/arrays)
  try {
    return JSON.parse(value);
  } catch {
    // Return as string if all else fails
    return value;
  }
}

export default useFile;
