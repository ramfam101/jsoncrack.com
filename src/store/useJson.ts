import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
  updateJsonByNodeId: (id: string, newText: any) => void;
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
   
updateJsonByNodeId: (id, newText) => {
  const path = useGraph.getState().selectedNode?.path;
  if (!path) return;
  set((state) => {
    let tree: any;
    try {
      tree = JSON.parse(state.json);
    } catch {
      tree = {};
    }
    const parts = path.replace(/^{Root}\.?/, "").split(".").filter(Boolean);
    let cursor = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (typeof cursor[key] !== "object" || cursor[key] === null) {
        cursor[key] = {};
      }
      cursor = cursor[key];
    }
    cursor[parts[parts.length - 1]] = newText;
    return { json: JSON.stringify(tree, null, 2) };
  });
}

}));

export default useJson;
