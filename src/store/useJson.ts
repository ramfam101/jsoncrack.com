import create from "zustand";
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

  setJson: (json) => {
    set({ json, loading: false });
    useGraph.getState().setGraph(json);
  },

  clear: () => {
    set({ json: "{}", loading: false });
    useGraph.getState().clearGraph();
  },

  updateJsonByNodeId: (id, newText) => {
    // Grab the JSON path you stored on the selected node
    const path = useGraph.getState().selectedNode?.path;
    if (!path) return;

    set((state) => {
      // Parse existing tree
      let tree: any;
      try {
        tree = JSON.parse(state.json);
      } catch {
        tree = {};
      }

      // Turn "{Root}.car.model" → ["car","model"]
      const parts = path
        .replace(/^{Root}\.?/, "")
        .split(".")
        .filter(Boolean);

      // Drill down to the parent object
      let cursor = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (typeof cursor[key] !== "object" || cursor[key] === null) {
          cursor[key] = {};
        }
        cursor = cursor[key];
      }

      // Set the final property
      cursor[parts[parts.length - 1]] = newText;

      // Write back the full tree
      return { json: JSON.stringify(tree, null, 2) };
    });
  },
}));

export default useJson;
