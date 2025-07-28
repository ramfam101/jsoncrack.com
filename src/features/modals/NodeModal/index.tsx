import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Textarea,
  Button,
  Group,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

// Helper to set value in object at a JSON path
const setValueAtJsonPath = (obj: any, path: string, value: any): any => {
  const segments = path
    .replace(/^\{Root\}/, "")
    .replace(/\[(\w+)\]/g, ".$1") // Convert [0] to .0
    .split(".")
    .filter(Boolean);

  const updated = structuredClone(obj);
  let current = updated;

  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    if (!(key in current)) current[key] = {};
    current = current[key];
  }

  current[segments.at(-1)!] = value;
  return updated;
};

// Convert data to pretty JSON string
const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };
  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph((state) => state.selectedNode);
  const path = selectedNode?.path || "";
  const originalData = dataToString(selectedNode?.text);

  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(originalData);

  const json = useFile((state) => state.getContents());
  const setContents = useFile((state) => state.setContents);

  useEffect(() => {
    if (opened) {
      setEditValue(originalData);
      setEditMode(false);
    }
  }, [opened, originalData]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue); // New value to set
      const parsedJson = JSON.parse(json); // Full existing JSON
      const updatedJson = setValueAtJsonPath(parsedJson, path, parsed);
      const newJsonStr = JSON.stringify(updatedJson, null, 2);

      setContents({ contents: newJsonStr }); // Update the source of truth
      setEditMode(false);
      onClose();
    } catch (err) {
      alert("Invalid JSON");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>
          {editMode ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.currentTarget.value)}
              minRows={8}
              autosize
              styles={{ input: { fontFamily: "monospace" } }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={originalData}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          )}
        </Stack>

        {editMode ? (
          <Group justify="flex-end">
            <Button color="green" onClick={handleSave}>Save</Button>
            <Button variant="default" onClick={onClose}>Cancel</Button>
          </Group>
        ) : (
          <Group justify="flex-end">
            <Button onClick={() => setEditMode(true)}>Edit</Button>
          </Group>
        )}

        <Text fz="xs" fw={500}>JSON Path</Text>
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

