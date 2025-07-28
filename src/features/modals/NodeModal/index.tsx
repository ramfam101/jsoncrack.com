import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group} from "@mantine/core";
import Editor, { type EditorProps, loader, type OnMount, useMonaco } from "@monaco-editor/react";
import { useState } from 'react';
import useFile from "../../../store/useFile";
import useConfig from "../../../store/useConfig";
import styled from "styled-components";
import type { NodeData } from "../../../types/graph";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

const StyledEditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: none;
`;

const StyledWrapper = styled.div`
  display: grid;
  height: 15vh;
  grid-template-columns: 100%;
  grid-template-rows: minmax(0, 1fr);
`;

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode?.text ? dataToString(state.selectedNode.text) : "");
  const path = useGraph(state => state.selectedNode?.path || "");

  const updateNode = useGraph(state => state.setSelectedNode);
  const updateFile = useFile(state => state.setContents);
  const getContents = useFile(state => state.getContents)
  const originalNode = useGraph.getState().selectedNode;
  const fileContents = getContents();
  const theme = useConfig(state => (state.darkmodeEnabled ? "vs-dark" : "light"));

  const [isEditing, setEdit] = useState(false);
  function handleEditClick() {
    setOriginalNodeInfo(nodeData);
    setCurrentNodeInfo(nodeData);
    setEdit(!isEditing);
  }

  const [originalNodeInfo, setOriginalNodeInfo] = useState("");
  const [currentNodeInfo, setCurrentNodeInfo] = useState("");
  function changeCurrentNodeInfo(newData) {
    setCurrentNodeInfo(newData ?? "");
  }
  
  function handleClose() {
    onClose();
    setEdit(false);
  }

  function handleSaveClick() {
    if (typeof(currentNodeInfo) === "string" && originalNodeInfo !== currentNodeInfo && currentNodeInfo.trim() !== "") {
      updateNode({
        ...originalNode,
        text: JSON.parse(currentNodeInfo),} as NodeData);
      
      const fileContentsJSON = JSON.parse(fileContents);
      const path = useGraph.getState().selectedNode?.path?.split(".") || [];
      
      let filePointer = fileContentsJSON;
      filePointer[path[path.length - 1]] = useGraph.getState().selectedNode?.text;
      updateFile({ contents: JSON.stringify(fileContentsJSON, null, 2) });
    }

    setEdit(false);
  }

  function nodeEditor(existingData) {
    loader.config({
      paths: {
        vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs",
      },
    });
  
    const editorOptions: EditorProps["options"] = {
      formatOnPaste: true,
      tabSize: 2,
      formatOnType: true,
      minimap: { enabled: false },
      stickyScroll: { enabled: false },
      scrollBeyondLastLine: false,
      placeholder: existingData,
      lineNumbers: "off",
      lineDecorationsWidth: 0,
      renderLineHighlight: "none",
      bracketPairColorization: { enabled: false },
      guides: { indentation: false },
      overviewRulerBorder: false,
      overviewRulerLanes: 0,
      foldingHighlight: false,
      matchBrackets: "never",
    };

    return (
      <StyledEditorWrapper>
        <StyledWrapper>
          <Editor
            height="100%"
            theme={theme}
            value={existingData}
            options={editorOptions}
            onChange={changeCurrentNodeInfo}
          />
        </StyledWrapper>
      </StyledEditorWrapper>
    );
  }

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={handleClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Stack gap="xs" style={{ flexDirection: "row" }}>
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!isEditing ? (
              <Button size="xs" variant="light" style={{ marginLeft: "auto", marginTop: -8 }} onClick={handleEditClick}>Edit</Button>
            ) : (
              <Group gap="xs" style={{ marginLeft: "auto" }}>
                <Button size="xs" color="green" style={{ marginTop: -8 }} onClick={handleSaveClick}>Save</Button>
                <Button size="xs" color="gray" style={{ marginTop: -8 }} onClick={handleEditClick}>Cancel</Button>
              </Group>
            )}
          </Stack>
          <ScrollArea.Autosize mah={250} maw={600}>
            {!isEditing ? (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            ) : (
              <>{nodeEditor(currentNodeInfo)}</>
            )}
          </ScrollArea.Autosize>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={path}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
