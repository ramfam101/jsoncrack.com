import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Textarea, Button, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import path from "path";
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
  //const path = useGraph(state => state.selectedNode?.path || "");
  const selectedNode = useGraph(state => state.selectedNode);
  const updateNodeData = useGraph(state => state.updateNodeData);
  const path = useGraph(state => state.path);

  const [editValue, setEditValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditValue(nodeData ?? "");
    setIsEditing(false);
  }, [nodeData]);

  // handle save
  const handleSave = () => {
    if (!updateNodeData || !selectedNode) return;

    try {
      const parsedData = JSON.parse(editValue);
      updateNodeData(selectedNode.id, { text: parsedData }); // Use id, not path
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Invalid JSON data", error);
    }
  };

  // handle edit and cancel
  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setEditValue(nodeData ?? "");
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <Textarea
            value={editValue}
            onChange={e => setEditValue(e.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={10}
            maw={600}
            miw={350}
            disabled={!isEditing}
          />
          <Group justify="flex-end" mt="xs">
            {!isEditing ? (
              <Button size="xs" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <>
                <Button size="xs" variant="default" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="xs" onClick={handleSave}>
                  Save
                </Button>
              </>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
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
