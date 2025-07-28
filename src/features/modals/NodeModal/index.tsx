import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) => {
  // If it's an array of pairs, convert to object, else use as is
  if (Array.isArray(data) && data.every(item => Array.isArray(item) && item.length === 2)) {
    return JSON.stringify(Object.fromEntries(data), null, 2);
  }
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const updateNodeValue = useGraph(state => state.updateNodeValue);

  // Store the latest node text as a string
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [displayValue, setDisplayValue] = useState("");

  // When modal opens or node changes, reset edit and display state
  React.useEffect(() => {
    if (opened && selectedNode) {
      const nodeText = dataToString(selectedNode.text);
      setEditing(false);
      setEditValue(nodeText);
      setDisplayValue(nodeText);
    }
  }, [opened, selectedNode]);

  const handleEdit = () => setEditing(true);

  const handleSave = () => {
    if (selectedNode) {
      let newValue: any = editValue;
      try {
        newValue = JSON.parse(editValue);
      } catch {
        // If not valid JSON, keep as string
      }

      // Convert array of pairs to object
      if (Array.isArray(newValue) && newValue.every(item => Array.isArray(item) && item.length === 2)) {
        newValue = Object.fromEntries(newValue);
      }

      // If the old value has only numeric keys, REPLACE it
      const oldText = selectedNode.text;
      const hasOnlyNumericKeys =
        typeof oldText === "object" &&
        oldText !== null &&
        Object.keys(oldText).length > 0 &&
        Object.keys(oldText).every(k => !isNaN(Number(k)));

      // If oldText has only numeric keys, or newValue is an object, REPLACE
      if (hasOnlyNumericKeys || (typeof newValue === "object" && newValue !== null && !Array.isArray(newValue))) {
        updateNodeValue(selectedNode.id, newValue);
      } else if (
        typeof oldText === "object" &&
        oldText !== null &&
        typeof newValue === "object" &&
        newValue !== null &&
        !Array.isArray(newValue)
      ) {
        updateNodeValue(selectedNode.id, { ...oldText, ...newValue });
      } else {
        updateNodeValue(selectedNode.id, newValue);
      }

      const formatted = typeof newValue === "string" ? newValue : JSON.stringify(newValue, null, 2);
      setDisplayValue(formatted);
      setEditValue(formatted);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(displayValue); // Reset textarea to last saved value
  };

  const path = selectedNode?.path || "";

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!editing && (
              <Button color="blue" size="xs" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {editing ? (
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                minRows={6}
                autosize
                style={{ minWidth: 350, maxWidth: 600, fontFamily: "monospace" }}
              />
            ) : (
              <CodeHighlight code={displayValue} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          {editing && (
            <Group mt="xs">
              <Button color="green" onClick={handleSave}>
                Save
              </Button>
              <Button variant="default" onClick={handleCancel}>
                Cancel
              </Button>
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
