import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useFile from "../../../store/useFile";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

// Helper to set a value at a given path in an object
function setValueAtPath(obj: any, path: string, value: any) {
  if (!path) return;
  const keys = path
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\./, '')
    .split('.');
  let temp = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in temp)) temp[keys[i]] = {};
    temp = temp[keys[i]];
  }
  temp[keys[keys.length - 1]] = value;
}

// Helper to get a value at a given path in an object
function getValueAtPath(obj: any, path: string) {
  if (!path) return obj;
  const keys = path
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\./, '')
    .split('.');
  let temp = obj;
  for (let i = 0; i < keys.length; i++) {
    if (temp == null) return undefined;
    temp = temp[keys[i]];
  }
  return temp;
}

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const rawPath = selectedNode?.path || "";
  const normalizedPath = rawPath.startsWith("{Root}.")
    ? rawPath.slice(7)
    : rawPath === "{Root}" ? "" : rawPath;
  const setContents = useFile(state => state.setContents);

  // Get the current JSON object
  const contents = useFile.getState().contents;
  let currentJson: any = {};
  try {
    currentJson = JSON.parse(contents);
  } catch {
    currentJson = {};
  }

  // Get the value at the path for editing
  const propertyValue = getValueAtPath(currentJson, normalizedPath);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    propertyValue !== undefined ? JSON.stringify(propertyValue, null, 2) : ""
  );

  useEffect(() => {
    const newValue = getValueAtPath(currentJson, normalizedPath);
    setEditValue(newValue !== undefined ? JSON.stringify(newValue, null, 2) : "");
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, normalizedPath, contents]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      const updatedJson = JSON.parse(contents);
      setValueAtPath(updatedJson, normalizedPath, parsed);
      const newJsonString = JSON.stringify(updatedJson, null, 2);
      setContents({ contents: newJsonString, skipUpdate: false });
      setIsEditing(false);
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  // Prevent editing the root node directly
  const isRoot = normalizedPath === "";

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing && !isRoot ? (
              <textarea
                style={{ width: "100%", minHeight: 150, fontFamily: "monospace" }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
            ) : (
              <CodeHighlight
                code={
                  propertyValue !== undefined
                    ? JSON.stringify(propertyValue, null, 2)
                    : ""
                }
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
          <Group mt={8} gap={8}>
            {!isEditing && !isRoot ? (
              <Button size="xs" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            ) : isEditing && !isRoot ? (
              <>
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" color="red" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : null}
          </Group>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={rawPath}
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