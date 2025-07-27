import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
  updateJson: (path: string, value: any) => void;
}

const initialStates = {
  json: "{}",
  loading: true,
};

export type JsonStates = typeof initialStates;

const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: json => {
    set({ json, loading: false });
    useGraph.getState().setGraph(json);
  },
  clear: () => {
    set({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },
  updateJson: (path, value) => { 
    // Parse the current JSON string to an object
    let jsonObj;
    try {
      jsonObj = JSON.parse(get().json);
    } catch {
      return;
    }

    // Simple path parsing: assumes path like "{Root}.fruit"
    // Remove "{Root}." and split by "."
    const keys = path.replace(/^\{Root\}\.?/, "").split(".");
    let obj = jsonObj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;

    const newJson = JSON.stringify(jsonObj, null, 2);
    set({ json: newJson });
    useGraph.getState().setGraph(newJson);
  }, 
}));

export default useJson;