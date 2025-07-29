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

const initialJsonContent = JSON.stringify(
  {
    fruit: {
      name: "Apple",
      color: "Red",
      weight: "150g",
    },
    car: {
      model: "Model S",
      year: 2022,
      brand: "Tesla",
    },
    person: {
      name: "Alice",
      occupation: "Engineer",
      age: 30,
    },
  },
  null,
  2
);

type UpdateFileContentArgs = {
  contents?: string;
  hasChanges?: boolean;
  skipUpdate?: boolean;
  format?: FileFormat;
};

type FileQuery = string | string[] | undefined;

interface FileStoreActions {
  getFileContents: () => string;
  getFileFormat: () => FileFormat;
  hasUnsavedChanges: () => boolean;
  updateError: (error: string | null) => void;
  updateHasChanges: (hasChanges: boolean) => void;
  updateFileContent: (args: UpdateFileContentArgs) => void;
  fetchFileUrl: (url: string) => void;
  updateFileFormat: (format: FileFormat) => void;
  clearFile: () => void;
  setFileData: (fileData: File) => void;
  setJsonSchema: (jsonSchema: object | null) => void;
  checkEditorSession: (url: FileQuery, widget?: boolean) => void;
}

export type FileRecord = {
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

const initialFileStoreState = {
  fileData: null as FileRecord | null,
  format: FileFormat.JSON,
  contents: initialJsonContent,
  error: null as any,
  hasChanges: false,
  jsonSchema: null as object | null,
};

export type FileStoreState = typeof initialFileStoreState;

const isURL = (value: string) => {
  return /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi.test(
    value
  );
};

const debouncedUpdateJson = debounce((value: unknown) => {
  useGraph.getState().setLoading(true);
  useJson.getState().setJson(JSON.stringify(value, null, 2));
}, 800);

export const useFile = create<FileStoreState & FileStoreActions>()((set, get) => ({
  ...initialFileStoreState,
  // Removed old function names, only new names below
  clearFile: () => {
    set({ contents: "" });
    useJson.getState().clear();
  },
  setJsonSchema: jsonSchema => set({ jsonSchema }),
  setFileData: fileData => {
    set({ fileData, format: fileData.format || FileFormat.JSON });
    get().updateFileContent({ contents: fileData.content, hasChanges: false });
    gaEvent("set_content", { label: fileData.format });
  },
  getFileContents: () => get().contents,
  getFileFormat: () => get().format,
  hasUnsavedChanges: () => get().hasChanges,
  updateFileFormat: async format => {
    try {
      const prevFormat = get().format;

      set({ format });
      const contentJson = await contentToJson(get().contents, prevFormat);
      const jsonContent = await jsonToContent(JSON.stringify(contentJson, null, 2), format);

      get().updateFileContent({ contents: jsonContent });
    } catch (error) {
      get().clearFile();
      console.warn("The content was unable to be converted, so it was cleared instead.");
    }
  },
  updateFileContent: async ({ contents, hasChanges = true, skipUpdate = false, format }) => {
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
  updateError: error => set({ error }),
  updateHasChanges: hasChanges => set({ hasChanges }),
  fetchFileUrl: async url => {
    try {
      const response = await fetch(url);
      const jsonStr = await response.text();
      get().updateFileContent({ contents: jsonStr });
      useJson.setState({ loading: false });
      useGraph.setState({ loading: false });
    } catch (error) {
      get().clearFile();
      useJson.setState({ loading: false });
      useGraph.setState({ loading: false });
    }
  },
  checkEditorSession: (url, widget) => {
    let contents = initialJsonContent;
    if (typeof url === "string" && url.length > 0) {
      contents = url;
    }
    get().updateFileContent({ contents, hasChanges: false });
  }
}));