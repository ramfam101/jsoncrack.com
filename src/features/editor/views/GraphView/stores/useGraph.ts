import type { ViewPort } from "react-zoomable-ui/dist/ViewPort";
import type { CanvasDirection } from "reaflow/dist/layout/elkLayout";
import { create } from "zustand";
import { SUPPORTED_LIMIT } from "../../../../../constants/graph";
import useJson from "../../../../../store/useJson";
import type { EdgeData, NodeData } from "../../../../../types/graph";
import { parser } from "../lib/jsonParser";
import { getChildrenEdges } from "../lib/utils/getChildrenEdges";
import { getOutgoers } from "../lib/utils/getOutgoers";

export interface Graph {
  viewPort: ViewPort | null;
  direction: CanvasDirection;
  loading: boolean;
  graphCollapsed: boolean;
  fullscreen: boolean;
  collapseAll: boolean;
  nodes: NodeData[];
  edges: EdgeData[];
  collapsedNodes: string[];
  collapsedEdges: string[];
  collapsedParents: string[];
  selectedNode: NodeData | null;
  path: string;
  aboveSupportedLimit: boolean;
}

const initialStates: Graph = {
  viewPort: null,
  direction: "RIGHT",
  loading: true,
  graphCollapsed: false,
  fullscreen: false,
  collapseAll: false,
  nodes: [],
  edges: [],
  collapsedNodes: [],
  collapsedEdges: [],
  collapsedParents: [],
  selectedNode: null,
  path: "",
  aboveSupportedLimit: false,
};

interface GraphActions {
  setGraph: (json?: string, options?: Partial<Graph>[]) => void;
  setLoading: (loading: boolean) => void;
  setDirection: (direction: CanvasDirection) => void;
  setViewPort: (ref: ViewPort) => void;
  setSelectedNode: (nodeData: NodeData) => void;
  updateSelectedNode: (newText: string) => void;
  focusFirstNode: () => void;
  expandNodes: (nodeId: string) => void;
  expandGraph: () => void;
  collapseNodes: (nodeId: string) => void;
  collapseGraph: () => void;
  getCollapsedNodeIds: () => string[];
  getCollapsedEdgeIds: () => string[];
  toggleFullscreen: (value: boolean) => void;
  toggleCollapseAll: (value: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerView: () => void;
  clearGraph: () => void;
  setZoomFactor: (zoomFactor: number) => void;
}

const useGraph = create<Graph & GraphActions>((set, get) => ({
  ...initialStates,
  toggleCollapseAll: collapseAll => {
    set({ collapseAll });
    get().collapseGraph();
  },
  clearGraph: () => set({ nodes: [], edges: [], loading: false }),
  getCollapsedNodeIds: () => get().collapsedNodes,
  getCollapsedEdgeIds: () => get().collapsedEdges,
  setSelectedNode: nodeData => set({ selectedNode: nodeData }),
  setGraph: (data, options) => {
    const { nodes, edges } = parser(data ?? useJson.getState().json);

    if (get().collapseAll) {
      if (nodes.length > SUPPORTED_LIMIT) {
        return set({ aboveSupportedLimit: true, ...options, loading: false });
      }

      set({ nodes, edges, aboveSupportedLimit: false, ...options });
      get().collapseGraph();
    } else {
      if (nodes.length > SUPPORTED_LIMIT) {
        return set({
          aboveSupportedLimit: true,
          collapsedParents: [],
          collapsedNodes: [],
          collapsedEdges: [],
          ...options,
          loading: false,
        });
      }

      set({
        nodes,
        edges,
        collapsedParents: [],
        collapsedNodes: [],
        collapsedEdges: [],
        graphCollapsed: false,
        aboveSupportedLimit: false,
        ...options,
      });
    }
  },
  setDirection: (direction = "RIGHT") => {
    set({ direction });
    setTimeout(() => get().centerView(), 200);
  },
  setLoading: loading => set({ loading }),
  expandNodes: nodeId => {
    const [childrenNodes, matchingNodes] = getOutgoers(
      nodeId,
      get().nodes,
      get().edges,
      get().collapsedParents
    );
    const childrenEdges = getChildrenEdges(childrenNodes, get().edges);

    const nodesConnectedToParent = childrenEdges.reduce((nodes: string[], edge) => {
      edge.from && !nodes.includes(edge.from) && nodes.push(edge.from);
      edge.to && !nodes.includes(edge.to) && nodes.push(edge.to);
      return nodes;
    }, []);
    const matchingNodesConnectedToParent = matchingNodes.filter(node =>
      nodesConnectedToParent.includes(node)
    );
    const nodeIds = childrenNodes.map(node => node.id).concat(matchingNodesConnectedToParent);
    const edgeIds = childrenEdges.map(edge => edge.id);

    const collapsedParents = get().collapsedParents.filter(cp => cp !== nodeId);
    const collapsedNodes = get().collapsedNodes.filter(nodeId => !nodeIds.includes(nodeId));
    const collapsedEdges = get().collapsedEdges.filter(edgeId => !edgeIds.includes(edgeId));

    set({
      collapsedParents,
      collapsedNodes,
      collapsedEdges,
      graphCollapsed: !!collapsedNodes.length,
    });
  },
  collapseNodes: nodeId => {
    const [childrenNodes] = getOutgoers(nodeId, get().nodes, get().edges);
    const childrenEdges = getChildrenEdges(childrenNodes, get().edges);

    const nodeIds = childrenNodes.map(node => node.id);
    const edgeIds = childrenEdges.map(edge => edge.id);

    set({
      collapsedParents: get().collapsedParents.concat(nodeId),
      collapsedNodes: get().collapsedNodes.concat(nodeIds),
      collapsedEdges: get().collapsedEdges.concat(edgeIds),
      graphCollapsed: !!get().collapsedNodes.concat(nodeIds).length,
    });
  },
  collapseGraph: () => {
    const edges = get().edges;
    const tos = edges.map(edge => edge.to);
    const froms = edges.map(edge => edge.from);
    const parentNodesIds = froms.filter(id => !tos.includes(id));
    const secondDegreeNodesIds = edges
      .filter(edge => parentNodesIds.includes(edge.from))
      .map(edge => edge.to);

    const collapsedParents = get()
      .nodes.filter(node => !parentNodesIds.includes(node.id) && node.data?.isParent)
      .map(node => node.id);

    const collapsedNodes = get()
      .nodes.filter(
        node => !parentNodesIds.includes(node.id) && !secondDegreeNodesIds.includes(node.id)
      )
      .map(node => node.id);

    const closestParentToRoot = Math.min(...collapsedParents.map(n => +n));
    const focusNodeId = `g[id*='node-${closestParentToRoot}']`;
    const rootNode = document.querySelector(focusNodeId);

    set({
      collapsedParents,
      collapsedNodes,
      collapsedEdges: get()
        .edges.filter(edge => !parentNodesIds.includes(edge.from))
        .map(edge => edge.id),
      graphCollapsed: true,
    });

    if (rootNode) {
      get().viewPort?.camera?.centerFitElementIntoView(rootNode as HTMLElement, {
        elementExtraMarginForZoom: 300,
      });
    }
  },
  expandGraph: () => {
    set({
      collapsedNodes: [],
      collapsedEdges: [],
      collapsedParents: [],
      graphCollapsed: false,
    });
  },
  focusFirstNode: () => {
    const rootNode = document.querySelector("g[id*='node-1']");
    get().viewPort?.camera?.centerFitElementIntoView(rootNode as HTMLElement, {
      elementExtraMarginForZoom: 100,
    });
  },
  setZoomFactor: zoomFactor => {
    const viewPort = get().viewPort;
    viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, zoomFactor);
  },
  zoomIn: () => {
    const viewPort = get().viewPort;
    viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, viewPort.zoomFactor + 0.1);
  },
  zoomOut: () => {
    const viewPort = get().viewPort;
    viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, viewPort.zoomFactor - 0.1);
  },
  centerView: () => {
    const viewPort = get().viewPort;
    viewPort?.updateContainerSize();

    const canvas = document.querySelector(".jsoncrack-canvas") as HTMLElement | null;
    if (canvas) {
      viewPort?.camera?.centerFitElementIntoView(canvas);
    }
  },
  toggleFullscreen: fullscreen => set({ fullscreen }),
  setViewPort: viewPort => set({ viewPort }),
  updateSelectedNode: newText => {
    const state = get();
    if (!state.selectedNode) return;

    // Parse the new value
    let updatedValue = JSON.parse(newText);

    // If the node is an object, convert to [key, value][] format for the graph
    let valueForGraph = updatedValue;
    if (
      state.selectedNode.data?.type === "object" &&
      updatedValue &&
      typeof updatedValue === "object" &&
      !Array.isArray(updatedValue)
    ) {
      valueForGraph = Object.entries(updatedValue);
    }

    // --- Update the root JSON in useJson ---
    // Helper to update the value at the correct path in the root JSON
    function updateJsonAtPath(obj: any, path: string | undefined, value: any) {
      if (!path || path === "root") return value;
      const keys = path.split(".").filter(k => k !== "root" && k !== "");
      if (keys.length === 0) return value;
      const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
      let temp = newObj;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        temp[k] = Array.isArray(temp[k]) ? [...temp[k]] : { ...temp[k] };
        temp = temp[k];
      }
      temp[keys[keys.length - 1]] = value;
      return newObj;
    }

    // Get and update the root JSON
    const rootJsonString = useJson.getState().json;
    const rootJson = typeof rootJsonString === "string" ? JSON.parse(rootJsonString) : rootJsonString;
    const updatedJson = updateJsonAtPath(rootJson, state.selectedNode.path, updatedValue);

    // Update the root JSON in useJson (this will also call setGraph and update the graph)
    useJson.getState().setJson(JSON.stringify(updatedJson, null, 2));

    // No need to manually update nodes/edges here, as setJson will trigger setGraph
  },
}));

export default useGraph;
