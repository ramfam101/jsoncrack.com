import React, { useState } from "react";
import { useSessionStorage } from "@mantine/hooks";
import styled from "styled-components";
import { ViewMode } from "../../enums/viewMode.enum";
import { GraphView } from "./views/GraphView";
import { TreeView } from "./views/TreeView";
import useFile from "../../store/useFile"; // Import the useFile store

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
  const { editJson } = useFile(); // Access the editJson method from the store
  const [path, setPath] = useState("");
  const [value, setValue] = useState("");

  const handleEdit = () => {
    try {
      editJson(path, value); // Call the editJson method
      alert("JSON updated successfully!");
    } catch (error) {
      alert("Failed to update JSON. Please check the path and value.");
    }
  };

  return (
    <StyledLiveEditor onContextMenuCapture={(e) => e.preventDefault()}>
      <View />
      <div style={{ position: "absolute", bottom: "100px", left: "10px" }}>
        <input
          type="text"
          placeholder="Path (e.g., fruits.0.name)"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="New Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button onClick={handleEdit}>Edit JSON</button>
      </div>
    </StyledLiveEditor>
  );
};

export default LiveEditor;