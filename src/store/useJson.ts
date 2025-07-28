import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";
import { set } from "lodash";
import useFile from "./useFile";

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
  updateNode: (path: string, value: any) => void;
}

const initialStates = {
  json: "{}",
  loading: true,
};

export type JsonStates = typeof initialStates;

const useJson = create<JsonStates & JsonActions>()((setState, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: json => {
    setState({ json, loading: false });
    useGraph.getState().setGraph(json);
  },
  clear: () => {
    setState({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },
  updateNode: (path: string, value: any) => {
    try {
      const currentJson = JSON.parse(get().json);
      const lodashPath = path.replace(/^\{Root\}\.?/, "");

      if (lodashPath === "") {
        const newJsonString = JSON.stringify(value, null, 2);
        setState({ json: newJsonString });
        useGraph.getState().setGraph(newJsonString);
        useFile.getState().setContents({ contents: newJsonString, skipUpdate: true });
        return;
      }

      const newJson = set(currentJson, lodashPath, value);
      const newJsonString = JSON.stringify(newJson, null, 2);
      setState({ json: newJsonString });
      useGraph.getState().setGraph(newJsonString);
      useFile.getState().setContents({ contents: newJsonString, skipUpdate: true });
    } catch (e) {
      console.error("Error updating node", e);
    }
  },
}));

export default useJson;
