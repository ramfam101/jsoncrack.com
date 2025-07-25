import React, { useState, useEffect } from "react";
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
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const updateSelectedNodeText = useGraph(state => state.updateSelectedNodeText);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData]);

  const handleEditClick = () => setIsEditing(true);
  const handleSaveClick = () => {
    try {
      const parsed = JSON.parse(editValue);
      updateSelectedNodeText(parsed);
    } catch (e) {
      return;
    }
    setIsEditing(false);
  };
  const handleCancelClick = () => {
    setEditValue(nodeData);
    setIsEditing(false);
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
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                minRows={6}
                autosize
                maw={600}
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
        <Stack gap="xs" mt="sm">
          {isEditing ? (
            <>
              <Button onClick={handleSaveClick} color="green">Save</Button>
              <Button onClick={handleCancelClick} variant="outline">Cancel</Button>
            </>
          ) : (
            <Button onClick={handleEditClick}>Edit</Button>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
};

// In useGraph store
updateSelectedNodeText: (newText) => set(state => ({
  selectedNode: {
    ...state.selectedNode,
    text: newText
  }
}))
