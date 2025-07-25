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
  setJson: json => {
    set({ json, loading: false });
    useGraph.getState().setGraph(json);
  },
  clear: () => {
    set({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },
  updateJsonByNodeId: (id, newText) => {
    set(state => {
      let updatedObj;
      try {
        updatedObj = JSON.parse(state.json);
      } catch {
        updatedObj = {};
      }

      // Recursively search and update the node by id
      function updateById(obj) {
        if (typeof obj !== "object" || obj === null) return obj;
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === "object") {
            if (obj[key].id === id) {
              obj[key] = { ...obj[key], ...newText };
            } else {
              obj[key] = updateById(obj[key]);
            }
          }
        }
        return obj;
      }

      const newJsonObj = updateById(updatedObj);

      return { json: JSON.stringify(newJsonObj, null, 2) };
    });
  },
}));

export default useJson;
