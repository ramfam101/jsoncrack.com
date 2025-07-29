import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState("");
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const updateNodeData = useGraph(state => state.updateNodeData); // Replace with the correct function name

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(nodeData);
  }

  const handleSave = () => {
    try {
      const parsedData = JSON.parse(editedData);
      updateNodeData(parsedData);
      setIsEditing(false);
    } catch (error) {
      alert("Incorrect JSON format. Please try correcting before saving.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(nodeData);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Stack align="center" justify="space-between" spacing="xs" direction="row">
            <Text fz="xs" fw={500}>
              Node Content
            </Text>
            {!isEditing ? (
              <Button size="xs" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <Stack direction="row" spacing="xs">
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" color="red" onClick={handleCancel}>
                  Cancel
                </Button>
              </Stack>
            )}
          </Stack>
          {!isEditing ? (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          ) : (
            <Textarea
              value={editedData}
              onChange={(e) => setEditedData(e.target.value)}
              autosize
              minRows={10}
              maxRows={15}
              maw={600}
              miw={350}
            />
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
