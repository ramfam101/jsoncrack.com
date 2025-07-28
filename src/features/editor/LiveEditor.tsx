import React,  { useState } from "react";
import { useSessionStorage } from "@mantine/hooks";
import styled from "styled-components";
import { Modal, Button, Textarea } from "@mantine/core";
import { ViewMode } from "../../enums/viewMode.enum";
import { GraphView } from "./views/GraphView";
import { TreeView } from "./views/TreeView";
import useGraph from "./views/GraphView/stores/useGraph";
import useJson from "../../store/useJson";
import useFile from "../../store/useFile";

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


const LiveEditor = () => {
  const selectedNode = useGraph(state => state.selectedNode);
  const json = useJson(state => state.json);
  const setContents = useFile(state => state.setContents);
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState("");

// Helper to convert array of pairs to object
function pairsToObject(pairs: [string, any][]) {
  return Object.fromEntries(pairs);
}

// Helper to convert object to array of pairs
function objectToPairs(obj: Record<string, any>) {
  return Object.entries(obj);
}

  // Open modal and prefill with node content
const handleEditClick = () => {
  let value = selectedNode?.text;
  // If it's an array of pairs, convert to object for editing
  if (Array.isArray(value)) {
    value = pairsToObject(value as [string, any][]);
  }
  if (value === undefined) value = "";
  setEditValue(JSON.stringify(value, null, 2));
  setEditOpen(true);
};

  // Save changes: update JSON and refresh graph
const handleSave = () => {
  try {
    let updatedValue = JSON.parse(editValue);

    // DO NOT convert to objectToPairs here!
    // Only do this for the graph, not for the JSON data.

    // Remove {Root} or Root from the path if present
    let path = selectedNode?.path?.split(".").filter(Boolean) || [];
    if (path[0] === "{Root}" || path[0] === "Root") {
      path = path.slice(1);
    }

    let parsed = JSON.parse(json);

    if (path.length === 0) {
      // Editing the root node
      parsed = updatedValue;
    } else {
      let ref = parsed;
      for (let i = 0; i < path.length - 1; i++) {
        if (ref[path[i]] === undefined) {
          alert("Invalid path: " + path.join("."));
          return;
        }
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = updatedValue;
    }

    setContents({ contents: JSON.stringify(parsed, null, 2) });
    setEditOpen(false);
  } catch (e: any) {
    alert("Invalid JSON: " + (e.message || e));
  }
};

  return (
    <StyledLiveEditor onContextMenuCapture={e => e.preventDefault()}>
    {/* Show the Edit Node button when a node is selected */}
    {selectedNode && (
      <Button
        style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
        onClick={handleEditClick}
        size="xs"
      >
        Edit Node
      </Button>
    )}
      <Modal opened={editOpen} onClose={() => setEditOpen(false)} title="Edit Node JSON" centered>
        <Textarea
          value={editValue}
          onChange={e => setEditValue(e.currentTarget.value)}
          minRows={6}
          autosize
        />
        <Button mt="md" onClick={handleSave} fullWidth>
          Save
        </Button>
      </Modal>
      {/* Pass the edit handler to GraphView */}
      <View onEditNode={handleEditClick} />
    </StyledLiveEditor>
  );
};

// Update View to accept and pass onEditNode
const View = ({ onEditNode }: { onEditNode: () => void }) => {
  const [viewMode] = useSessionStorage({
    key: "viewMode",
    defaultValue: ViewMode.Graph,
  });

  if (viewMode === ViewMode.Graph) return <GraphView onEditNode={onEditNode} />;
  if (viewMode === ViewMode.Tree) return <TreeView onEditNode={onEditNode} />;
  return null;
};

export default LiveEditor;