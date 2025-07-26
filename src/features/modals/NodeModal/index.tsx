import React, { use } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { stat } from "fs";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState("");  
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");

  const handleEdit = () => {
    const { selectedNode } = useGraph.getState();
    if (!selectedNode) return;
  
    const initial = Array.isArray(selectedNode.text)
      ? JSON.stringify(Object.fromEntries(selectedNode.text), null, 2)
      : JSON.stringify(selectedNode.text, null, 2);
  
    setEditText(initial);
    setIsEditing(true);
  };

  const handleSave = () => {
    const { selectedNode } = useGraph.getState();
    if (!selectedNode) return;
  
    try {
      const parsed = JSON.parse(editText);
      const newText = Array.isArray(selectedNode.text)
        ? Object.entries(parsed)
        : parsed;
  
      useGraph.setState(() => ({
        selectedNode: {
          ...selectedNode,
          text: newText,
        },
      }));
      setIsEditing(false);
    } catch {
      alert("Invalid JSON");
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditText("");
  };  

  React.useEffect(() => {
    if (isEditing && selectedNode?.text) {
      const initial = Array.isArray(selectedNode.text)
        ? JSON.stringify(Object.fromEntries(selectedNode.text), null, 2)
        : JSON.stringify(selectedNode.text, null, 2);
  
      setEditText(initial);
    }
  }, [isEditing, selectedNode]);

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Button onClick = {handleEdit}> 
          Edit Node
        </Button>
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
          </ScrollArea.Autosize>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        {isEditing ? (
  <>
    <textarea
      value={editText}
      onChange={(e) => setEditText(e.target.value)}
      style={{
        width: "100%",
        minHeight: "150px",
        fontFamily: "monospace",
        fontSize: "14px",
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
    />
    <Stack justify="flex-end" gap="xs" mt="xs">
      <Button color="green" onClick={handleSave}>Save</Button>
      <Button variant="outline" onClick={handleCancel}>Cancel</Button>
    </Stack>
  </>
) : (
  <ScrollArea.Autosize mah={250} maw={600}>
    <CodeHighlight
      code={nodeData}
      miw={350}
      maw={600}
      language="json"
      withCopyButton
    />
  </ScrollArea.Autosize>
)}
      </Stack>
    </Modal>
  );
};


