import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Flex } from "@mantine/core";
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
  const selectedNode = useGraph(state => state.selectedNode);
  const updateNode = useGraph(state => state.updateNode); // <-- You must add this to your store

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
    setError(null);
  }, [nodeData]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      if (updateNode && selectedNode) {
        updateNode(selectedNode.id, parsed); // <-- Make sure your store supports this
      }
      setIsEditing(false);
      setError(null);
    } catch (e) {
      setError("Invalid JSON format.");
    }
  };

  const handleCancel = () => {
    setEditValue(nodeData);
    setIsEditing(false);
    setError(null);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Flex align="center" justify="space-between">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!isEditing && (
              <Button
                size="xs"
                color="blue"
                variant="filled"
                onClick={() => setIsEditing(true)}
                style={{ minWidth: 50 }}
              >
                Edit
              </Button>
            )}
          </Flex>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <textarea
                style={{
                  width: "100%",
                  minHeight: 150,
                  fontFamily: "monospace",
                  fontSize: 14,
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  resize: "vertical"
                }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
            ) : (
              <CodeHighlight
                code={editValue}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
          {isEditing && (
            <Group mt="xs">
              <Button size="xs" color="green" onClick={handleSave}>
                Save
              </Button>
              <Button size="xs" color="gray" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              {error && (
                <Text color="red" size="xs" ml="sm">
                  {error}
                </Text>
              )}
            </Group>
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