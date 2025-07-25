import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
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
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const selectedNode = useGraph(state => state.selectedNode);
  const graph = useGraph();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(nodeData);

  useEffect(() => {
    if (!isEditing) {
      setEditedContent(nodeData);
    }
  }, [nodeData, isEditing]);
  const handleSave = () => {
    try {
      const parsedJson = JSON.parse(editedContent);
      if (selectedNode) {
        setSelectedNode({ ...selectedNode, text: parsedJson });
      }
      setIsEditing(false);
    } catch (err) {
      alert("Invalid JSON");
    }
  };

  const handleCancel = () => {
    setEditedContent(nodeData);
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Group justify="space-between">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {!isEditing && (
            <Button size="xs" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </Group>
        {isEditing ? (
          <>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.currentTarget.value)}
              autosize
              minRows={5}
              maxRows={10}
            />
            <Group justify="space-between" mt="sm">
              <Button size="xs" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="xs" onClick={handleSave}>
                Save
              </Button>
            </Group>
          </>
        ) : (
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
          </ScrollArea.Autosize>
        )}
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
