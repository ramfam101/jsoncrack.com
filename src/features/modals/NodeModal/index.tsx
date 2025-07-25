import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { useState } from "react";
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
  const nodeData = dataToString(selectedNode?.text);
  const path = selectedNode?.path || "";

  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(nodeData);

  const updateNode = useGraph(state => state.updateNode);

  React.useEffect(() => {
    setEditedValue(nodeData);
    setIsEditing(false);
  }, [nodeData, opened]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedValue);
      if (selectedNode?.id) {
        updateNode(selectedNode.id, parsed);
      } else {
        alert("Node ID is missing.");
      }
      setIsEditing(false);
    } catch (e) {
      alert("Invalid JSON");
    }
  };
  

  return (
<Modal
  title={
    <Group justify="space-between" align="center">
      <Text>Node Content</Text>
      {!isEditing && (
        <Button size="xs" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      )}
      {isEditing && (
        <Button size="xs" color="green" onClick={handleSave}>
          Save
        </Button>
      )}
    </Group>
      }
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
    >
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editedValue}
                onChange={e => setEditedValue(e.currentTarget.value)}
                autosize
                minRows={6}
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
      </Stack>
    </Modal>
  );
};
