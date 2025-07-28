import React from "react";
import type { ModalProps } from "@mantine/core";
import type { EdgeData, NodeData } from "../../../types/graph";
import { Modal, Stack, Text, Textarea, ScrollArea, Group, Button } from "@mantine/core";
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

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(nodeData)
  const updateSelectedNode = useGraph(state => state.updateSelectedNode); // needs to be implemented

  const handleEdit = () => {
    setEditValue(nodeData); // set edit value to current node data 
    setIsEditing(true);
  }
  const handleCancel = () => setIsEditing(false);

  const handleSave = () => {
    try {
      const parsedEdit = JSON.parse(editValue);
      updateSelectedNode(parsedEdit);
      setIsEditing(false);
    } catch {
      alert("Invalid JSON");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group mt="xs" mb="md" justify="space-between"> 
            <Text fz="xs" fw={500}> Content </Text>
            {!isEditing && ( // show edit button when not editing
              <Button onClick={handleEdit}> Edit </Button>
            )}
            {isEditing && ( // show save and cancel buttons when editing
              <Group justify="right">
                <Button color = "green" onClick={handleSave}>Save</Button>
                <Button variant="outline" color = "red" onClick={handleCancel}>Cancel</Button>
              </Group>
            )}
          </Group>  
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (  // change to editable textarea when editing
              <Textarea
                autosize
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
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