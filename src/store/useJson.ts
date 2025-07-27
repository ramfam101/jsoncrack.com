import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
}

const initialStates = {
  json: "{}",
  json_version: 0,
  loading: true,
};

export type JsonStates = typeof initialStates;

const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: json => {
    set(state => ({
      json,
      json_version: state.json_version + 1,
      loading: false,
    }));
    useGraph.getState().setGraph(json);
  },
  clear: () => {
    set({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },
}));

export default useJson;
