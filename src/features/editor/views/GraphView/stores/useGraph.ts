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

const useGraph = create<Graph & {
  setGraph: (data?: string, options?: Partial<Graph>[]) => void;
  setLoading: (loading: boolean) => void;
  setDirection: (direction: CanvasDirection) => void;
  setViewPort: (ref: ViewPort) => void;
  setSelectedNode: (nodeData: NodeData) => void;
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
  updateNodeValue: (path: string, value: any) => void;
}>((set, get) => (
  {
    ...initialStates,
    setGraph: (data, options) => {
      const { nodes, edges } = parser(data ?? useJson.getState().json);
      if ((get() as any).collapseAll) {
        if (nodes.length > SUPPORTED_LIMIT) {
          return set({ aboveSupportedLimit: true, ...options, loading: false });
        }
        set({ nodes, edges, aboveSupportedLimit: false, ...options });
        (get() as any).collapseGraph();
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
    setLoading: loading => set({ loading }),
    setDirection: (direction = "RIGHT") => {
      set({ direction });
      setTimeout(() => (get() as any).centerView(), 200);
    },
    setViewPort: viewPort => set({ viewPort }),
    setSelectedNode: nodeData => set({ selectedNode: nodeData }),
    focusFirstNode: () => {
      const rootNode = document.querySelector("g[id*='node-1']");
      (get() as any).viewPort?.camera?.centerFitElementIntoView(rootNode as HTMLElement, {
        elementExtraMarginForZoom: 100,
      });
    },
    expandNodes: nodeId => {
      const [childrenNodes, matchingNodes] = getOutgoers(
        nodeId,
        (get() as any).nodes,
        (get() as any).edges,
        (get() as any).collapsedParents
      );
      const childrenEdges = getChildrenEdges(childrenNodes, (get() as any).edges);
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
      const collapsedParents = (get() as any).collapsedParents.filter(cp => cp !== nodeId);
      const collapsedNodes = (get() as any).collapsedNodes.filter(nodeId => !nodeIds.includes(nodeId));
      const collapsedEdges = (get() as any).collapsedEdges.filter(edgeId => !edgeIds.includes(edgeId));
      set({
        collapsedParents,
        collapsedNodes,
        collapsedEdges,
        graphCollapsed: !!collapsedNodes.length,
      });
    },
    expandGraph: () => {
      set({
        collapsedNodes: [],
        collapsedEdges: [],
        collapsedParents: [],
        graphCollapsed: false,
      });
    },
    collapseNodes: nodeId => {
      const [childrenNodes] = getOutgoers(nodeId, (get() as any).nodes, (get() as any).edges);
      const childrenEdges = getChildrenEdges(childrenNodes, (get() as any).edges);
      const nodeIds = childrenNodes.map(node => node.id);
      const edgeIds = childrenEdges.map(edge => edge.id);
      set({
        collapsedParents: (get() as any).collapsedParents.concat(nodeId),
        collapsedNodes: (get() as any).collapsedNodes.concat(nodeIds),
        collapsedEdges: (get() as any).collapsedEdges.concat(edgeIds),
        graphCollapsed: !!(get() as any).collapsedNodes.concat(nodeIds).length,
      });
    },
    collapseGraph: () => {
      const edges = (get() as any).edges;
      const tos = edges.map(edge => edge.to);
      const froms = edges.map(edge => edge.from);
      const parentNodesIds = froms.filter(id => !tos.includes(id));
      const secondDegreeNodesIds = edges
        .filter(edge => parentNodesIds.includes(edge.from))
        .map(edge => edge.to);
      const collapsedParents = (get() as any)
        .nodes.filter(node => !parentNodesIds.includes(node.id) && node.data?.isParent)
        .map(node => node.id);
      const collapsedNodes = (get() as any)
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
        collapsedEdges: (get() as any)
          .edges.filter(edge => !parentNodesIds.includes(edge.from))
          .map(edge => edge.id),
        graphCollapsed: true,
      });
      if (rootNode) {
        (get() as any).viewPort?.camera?.centerFitElementIntoView(rootNode as HTMLElement, {
          elementExtraMarginForZoom: 300,
        });
      }
    },
    getCollapsedNodeIds: () => (get() as any).collapsedNodes,
    getCollapsedEdgeIds: () => (get() as any).collapsedEdges,
    toggleFullscreen: fullscreen => set({ fullscreen }),
    toggleCollapseAll: value => set({ collapseAll: value }),
    zoomIn: () => {
      const viewPort = (get() as any).viewPort;
      viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, viewPort.zoomFactor + 0.1);
    },
    zoomOut: () => {
      const viewPort = (get() as any).viewPort;
      viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, viewPort.zoomFactor - 0.1);
    },
    centerView: () => {
      const viewPort = (get() as any).viewPort;
      viewPort?.updateContainerSize();
      const canvas = document.querySelector(".jsoncrack-canvas") as HTMLElement | null;
      if (canvas) {
        viewPort?.camera?.centerFitElementIntoView(canvas);
      }
    },
    clearGraph: () => set({ ...initialStates }),
    setZoomFactor: zoomFactor => {
      const viewPort = (get() as any).viewPort;
      viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, zoomFactor);
    },
    updateNodeValue: (path: string, value: any) => {
      set(state => ({
        ...state,
        nodes: state.nodes.map(node =>
          node.path === path ? { ...node, text: value } : node
        ),
        selectedNode:
          state.selectedNode && state.selectedNode.path === path
            ? { ...state.selectedNode, text: value }
            : state.selectedNode,
      }));
    },
  }
));

export default useGraph;