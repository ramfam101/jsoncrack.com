import type { NodeData, EdgeData } from "../../../../../../types/graph";

// Helper: Find children of a node
function getChildren(nodeId: string, edges: EdgeData[]) {
  return edges.filter(e => e.from === nodeId).map(e => e.to);
}

// Recursive function to build JSON from a node
function buildJson(nodeId: string, nodes: NodeData[], edges: EdgeData[]): any {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  if (node.data?.type === "object") {
    const obj: Record<string, any> = {};
    const children = getChildren(nodeId, edges);
    for (const childId of children) {
      const childNode = nodes.find(n => n.id === childId);
      if (childNode) {
        obj[String(childNode.text)] = buildJson(childId, nodes, edges);
      }
    }
    return obj;
  }

  if (node.data?.type === "array") {
    const arr: any[] = [];
    const children = getChildren(nodeId, edges);
    for (const childId of children) {
      arr.push(buildJson(childId, nodes, edges));
    }
    return arr;
  }

  // Primitive value
  return node.text;
}

export function graphToJson(nodes: NodeData[], edges: EdgeData[]): any {
  // Find the root node (usually id "1" or the node with no incoming edges)
  const allTo = new Set(edges.map(e => e.to));
  const root = nodes.find(n => !allTo.has(n.id)) || nodes[0];
  if (!root) return {};

  return buildJson(root.id, nodes, edges);
}