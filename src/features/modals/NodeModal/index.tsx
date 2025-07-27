import React, { useState } from "react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(nodeData);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedContent);
      useGraph.getState().updateNode?.(path, parsed);
      setIsEditing(false);
      setEditedContent(dataToString(parsed));
    } catch (e) {
      console.error("Invalid JSON format", e);
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {isEditing ? (
              <Group align="center">
                <Button style={{ backgroundColor: "#3f7eecff" }} onClick={handleSave}>
                  Save
                </Button>
                <Button style={{ backgroundColor: "gray" }} onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </Group>
            ) : (
              <Button
                style={{ backgroundColor: "green" }}
                onClick={() => {
                  setEditedContent(nodeData ?? "");
                  setIsEditing(true);
                }}
              >
                Edit
              </Button>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editedContent ?? ""}
                onChange={event => setEditedContent(event.currentTarget.value)}
                minRows={8}
                autosize
                styles={{ input: { fontFamily: "monospace", fontSize: 14 } }}
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
