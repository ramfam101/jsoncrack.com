import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
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
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const setNodeText = useGraph(state => state.setNodeText); // Assumes you have a setter for node text

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  React.useEffect(() => {
    setEditValue(nodeData);
    setEditing(false);
  }, [nodeData, opened]);

  const handleEditClick = () => setEditing(true);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);

      // Maintain the same type as the original node text
      let valueToSave = parsed;
      if (typeof selectedNode?.text === "string") {
        valueToSave = JSON.stringify(parsed); // Save as string if original was string
      } else if (Array.isArray(selectedNode?.text)) {
        valueToSave = Object.entries(parsed); // Save as array of entries if original was array
      }

      if (selectedNode?.id) {
        setNodeText(selectedNode.id, valueToSave);
        setEditing(false);
      } else {
        alert("Node ID is missing.");
      }
    } catch {
      alert("Invalid JSON");
    }
  };

  const handleCancel = () => {
    setEditValue(nodeData);
    setEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {editing ? (
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                minRows={6}
                autosize
                maw={600}
                miw={350}
                styles={{ input: { fontFamily: "monospace" } }}
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
        <Group mt="md">
          {editing ? (
            <>
              <Button color="green" onClick={handleSave}>
                Save
              </Button>
              <Button variant="default" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEditClick} color="blue">
              Edit
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};

