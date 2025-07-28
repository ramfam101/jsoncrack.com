import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  return JSON.stringify(text, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const json = useJson(state => state.json);
  const setJson = useJson(state => state.setJson);
  const selectedNode = useGraph(state => state.selectedNode);
  const path = selectedNode?.path || "";

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const nodeData = useGraph(state => dataToString(state.selectedNode?.text || state.selectedNode?.data));

    useEffect(() => {
    if (opened) {
      setEditValue(nodeData);
    }
  }, [opened, nodeData]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(json);
      const newValue = JSON.parse(editValue);
      const keyPath = pathToKeys(path);

      let obj = parsed;
      for (let i = 0; i < keyPath.length - 1; i++) {
        obj = obj[keyPath[i]];
      }
      obj[keyPath[keyPath.length - 1]] = newValue;

      setJson(JSON.stringify(parsed, null, 2));
      setEditing(false);
      onClose(); // close modal after save
    } catch (err) {
      alert("Invalid JSON format.");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Text fz="xs" fw={500}>Content</Text>
        <ScrollArea.Autosize mah={250} maw={600}>
          {editing ? (
            <Textarea
              autosize
              minRows={6}
              value={editValue}
              onChange={(e) => setEditValue(e.currentTarget.value)}
              miw={350}
              maw={600}
            />
          ) : (
            <CodeHighlight
              code={editValue || "// No content available"}
              miw={350}
              maw={600}
              language="json"
              withCopyButton
            />
          )}
        </ScrollArea.Autosize>

        <Text fz="xs" fw={500}>JSON Path</Text>
        <CodeHighlight
          code={path}
          miw={350}
          language="json"
          withCopyButton
        />

        <Group justify="flex-end" mt="sm">
          {editing ? (
            <>
              <Button onClick={handleSave} color="green">Save</Button>
              <Button onClick={() => setEditing(false)} color="gray">Cancel</Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>Edit</Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};

// Helper: turn "{Root}.fruit.name" → ["fruit", "name"]
function pathToKeys(path: string): string[] {
  return path
    .replace("{Root}", "")
    .split(".")
    .filter(Boolean);
}