import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Flex, Textarea } from "@mantine/core";
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
  const updateNode = useGraph(state => state.updateNode); // You need to have this action in your store

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // Keep editValue in sync with nodeData when modal opens or node changes
  React.useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
  }, [nodeData, opened]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setEditValue(nodeData);
    setIsEditing(false);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      updateNode(path, parsed); // You need to implement updateNode(path, value) in your store
      setIsEditing(false);
    } catch (e) {
      // Optionally show error
      alert("Invalid JSON");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!isEditing ? (
              <Button size="xs" variant="light" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <Flex gap="xs">
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="default" onClick={handleCancel}>
                  Cancel
                </Button>
              </Flex>
            )}
          </Flex>
          <ScrollArea.Autosize mah={250} maw={600}>
            {!isEditing ? (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            ) : (
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                minRows={6}
                autosize
                spellCheck={false}
                styles={{ input: { fontFamily: "monospace", fontSize: 14 } }}
              />
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
