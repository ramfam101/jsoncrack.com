import React, { useEffect } from "react";
import styled from "styled-components";
import LiveEditor from "./LiveEditor";
import TextEditor from "./TextEditor";
import useGraph from "./views/GraphView/stores/useGraph";
import useFile from "../../store/useFile";

// Helper to convert nodes to JSON (adjust as needed for your structure)
function nodesToJson(nodes: any[]) {
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

export const MainEditor = () => {
  const nodes = useGraph(state => state.nodes);
  const setContents = useFile(state => state.setContents);
  const contents = useFile(state => state.contents);

  // Sync graph changes to text editor (instant, one-way)
  /*useEffect(() => {
    const newContents = JSON.stringify(nodesToJson(nodes), null, 2);
    setContents({ contents: newContents, skipUpdate: true });
    // Logging for debugging
    console.log("[MainEditor] nodes changed:", nodes);
    console.log("[MainEditor] newContents:", newContents);
  }, [nodes, setContents]);*/

  // Optional: Sync text editor changes to graph (uncomment for two-way sync)
  // useEffect(() => {
  //   try {
  //     const parsed = JSON.parse(contents);
  //     useGraph.getState().setGraph(parsed);
  //   } catch (e) {
  //     // Ignore invalid JSON
  //   }
  // }, [contents]);

  return (
    <EditorLayout>
      <TextEditorWrapper>
        <TextEditor />
      </TextEditorWrapper>
      <LiveEditorWrapper>
        <LiveEditor />
      </LiveEditorWrapper>
    </EditorLayout>
  );
};

const EditorLayout = styled.div`
  display: flex;
  height: 100%;
`;

const TextEditorWrapper = styled.div`
  width: 40%;
  min-width: 320px;
  height: 100%;
  border-right: 1px solid ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
`;

const LiveEditorWrapper = styled.div`
  width: 60%;
  height: 100%;
`;