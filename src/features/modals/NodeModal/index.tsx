import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Button } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
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
  const updateNodeContent = useGraph(state => state.updateNodeContent); // Fix here

  // Add local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // When Edit is clicked, show textarea
  const handleEdit = () => {
    setEditValue(nodeData);
    setIsEditing(true);
  };

  // Save logic
  const handleSave = () => {
    try {
      const parsedValue = JSON.parse(editValue); // Ensure valid JSON
      updateNodeContent(path, parsedValue); // Update the node content in the store
      setIsEditing(false);
      alert("Node content updated successfully!");
    } catch (error) {
      alert("Invalid JSON format. Please correct it and try again.");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Stack>
                <textarea
                  style={{ width: "100%", minHeight: "150px" }}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                />
                <Stack gap="xs" justify="flex-end" style={{ flexDirection: "row" }}>
                  <Button onClick={handleSave}>Save</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          {!isEditing && (
            <Stack align="flex-end">
              <Button onClick={handleEdit}>Edit</Button>
            </Stack>
          )}
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
