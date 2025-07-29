import React from "react";
import { CodeHighlight } from "@mantine/code-highlight";
import { useSessionStorage } from "@mantine/hooks";
import styled from "styled-components";
import useGraph from "./views/GraphView/stores/useGraph";
import { ViewMode } from "../../enums/viewMode.enum";
import { GraphView } from "./views/GraphView";
import { TreeView } from "./views/TreeView";

const StyledLiveEditor = styled.div`
  position: relative;
  height: 100%;
  background: ${({ theme }) => theme.GRID_BG_COLOR};
  overflow: auto;
  cursor: url("/assets/cursor.svg"), auto;

  & > ul {
    margin-top: 0 !important;
    padding: 12px !important;
    font-family: monospace;
    font-size: 14px;
    font-weight: 500;
  }

  .tab-group {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
  }
`;

function nodesToJson(nodes: any[]) {
  // Example implementation: reconstructs a simple object from nodes with key/value pairs
  // You may need to adjust this based on your actual node structure
  const result: Record<string, any> = {};
  nodes.forEach(node => {
    if (node.data && node.data.key) {
      result[node.data.key] = node.text;
    } else if (node.id && node.text) {
      result[node.id] = node.text;
    }
  });
  return result;
}

const View = () => {
  const [viewMode] = useSessionStorage({
    key: "viewMode",
    defaultValue: ViewMode.Graph,
  });

  if (viewMode === ViewMode.Graph) return <GraphView />;
  if (viewMode === ViewMode.Tree) return <TreeView />;
  return null;
};

const LiveEditor = () => {
  const nodes = useGraph(state => state.nodes);
  const json = nodesToJson(nodes);

  return (
    <StyledLiveEditor onContextMenuCapture={e => e.preventDefault()}>
      <View />
      <CodeHighlight code={JSON.stringify(json, null, 2)} language="json" />
    </StyledLiveEditor>
  );
};

export default LiveEditor;