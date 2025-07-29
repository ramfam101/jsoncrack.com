import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import Editor, { OnMount, loader } from "@monaco-editor/react";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";
import useConfig from "../../../store/useConfig";
import SaveEditor from "../../editor/SaveEditor";
import styled from "styled-components";


loader.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs",
  },
});




const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};


export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const SelectedNode = useGraph(state => state.selectedNode);

  const nodeData = SelectedNode?.text ? dataToString(SelectedNode.text): "{}";
  const path = useGraph(state => state.selectedNode?.path);
  const theme = useConfig(state => (state.darkmodeEnabled ? "vs-dark" : "light"));
  const format = useFile(state => state.format); 
  const currentJson = useFile(state => state.contents);
  const setText = useFile(state => state.setText);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(nodeData);
  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
};;

useEffect(() => {
  if (!opened) {
    setIsEditing(false);
    if (SelectedNode?.text){
      setEditData(dataToString(SelectedNode.text));
    }
  }
}, [opened, SelectedNode]);


useEffect(() => {
  if (!isEditing) {
    if (SelectedNode?.text) {
      setEditData(dataToString(SelectedNode.text));
    }
  }
}, [SelectedNode, isEditing]);


const setCancel = () => {
    if (SelectedNode?.text){
      setEditData(nodeData);
    }
    setIsEditing(false);
    onClose();
}


  const setSave = () => {
    try {
      const parsed = JSON.parse(editData);
      console.log("Saving data:", parsed, "to node:", SelectedNode?.id, "at path:", path);
      if (path) {
        setText(path, parsed);  // ⬅️ Updates only the selected node
        setIsEditing(false);
      }
    } catch (err) {
      alert("Invalid JSON");
    }
    onClose();
  };


  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        {!isEditing && (<Button className="button" onClick={toggleEditing} style={{ alignSelf: "flex-end" }}>Edit</Button>)}

        {isEditing &&(
            <Stack gap="xs" align="flex-end" pr="sm">
              <Button className="button" onClick={setSave}> Save</Button>
              <Button className="button" onClick={setCancel}> Cancel</Button>
            </Stack>
        )}
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <SaveEditor
                height="300px"
                language={format}
                theme={theme}
                value={editData}
                onChange={value => setEditData(value ?? "")}
                options={{
                  formatOnPaste: true,
                  tabSize: 2,
                  formatOnType: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                }}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
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

const Button = styled.button`
  background-color: #4c6fafff;
  color: white;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
  alpha: 0.3;

  &:hover {
    background-color: #45a049;
  }
`;