import type { NodeType } from "jsonc-parser";
import type { Graph } from "../jsonParser";
import { calculateNodeSize } from "./calculateNodeSize";

type Props = {
  graph: Graph;
  text: string | [string, string][];
  isEmpty?: boolean;
  type?: NodeType;
  path: string; // <-- Add this line
};

export const addNodeToGraph = ({ graph, text, type = "null", isEmpty = false, path }: Props) => {
  const id = path; // <-- Use the path as the node's id
  const isParent = type === "array" || type === "object";
  const { width, height } = calculateNodeSize(text, isParent);

  const node = {
    id,
    text,
    width,
    height,
    data: {
      type,
      isParent,
      isEmpty,
      childrenCount: isParent ? 1 : 0,
    },
  };

  graph.nodes.push(node);

  return id;
};
