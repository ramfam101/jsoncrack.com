import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";

interface JsonActions {
  setJson: (json: object) => void;
  getJson: () => object;
  clear: () => void;
}

const initialStates = {
  json: {}, // Store as an object, not a string
  loading: true,
};

export type JsonStates = typeof initialStates;

const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: json => {
    let parsed = json;
    if (typeof json === "string") {
      try {
        parsed = JSON.parse(json);
      } catch {
        parsed = {};
      }
    }
    set({ json: parsed, loading: false });
    useGraph.getState().setGraph(JSON.stringify(parsed)); // always a string
  },
  clear: () => {
    set({ json: {}, loading: false });
    useGraph.getState().clearGraph();
  },
}));

export default useJson;