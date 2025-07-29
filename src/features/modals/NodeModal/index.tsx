import type { ModalProps } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";
import React, { useEffect, useState } from "react";
import {Modal, Stack, Text, ScrollArea, Button, Textarea, Group,} from "@mantine/core";


const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  return JSON.stringify(text, null, 2);
};


// Get value from nested object using a dot-path
const getValueByPath = (obj: any, path: string): any => {
  let cleanedPath = path.trim().replace(/^\{Root\}/, "").replace(/^\./, "");
  if (!cleanedPath) return obj;

  return cleanedPath.split(".").reduce((acc, key) => acc?.[key], obj);
};

// Set a deep value in object at a dot-path like 
const setDeepValue = (obj: any, path: string, value: any): boolean => {
  let cleanedPath = path.trim().replace(/^\{Root\}/, "").replace(/^\./, "");
  if (!cleanedPath) {
    Object.keys(obj).forEach((key) => delete obj[key]);
    Object.assign(obj, value);
    return true;
  }

  const keys = cleanedPath.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current) || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
  return true;
};


export const NodeModal = ({ opened, onClose }: ModalProps) => {

  const node = useGraph((state) => state.selectedNode);
  const path = node?.path || "";

  const setContents = useFile((state) => state.setContents);
  const getContents = useFile.getState().getContents;

  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState("{}");

   // Refresh content when modal opens or path changes
  useEffect(() => {
    if (!opened) return;

    try {
      const fullJson = JSON.parse(getContents());
      const nodeData = getValueByPath(fullJson, path) ?? {};
      setEditedText(dataToString(nodeData));
    } catch {
      setEditedText("{}");
    }
    setEditing(false);
  }, [opened, path, getContents]);

  const handleSave = () => {
    try {
      const newValue = JSON.parse(editedText);
      const fullJson = JSON.parse(getContents());

      if (!path) {
        alert("Missing JSON path!");
        return;
      }

      const success = setDeepValue(fullJson, path, newValue);
      if (!success) {
        alert("Failed to update JSON path!");
        return;
      }

      setContents({
        contents: JSON.stringify(fullJson, null, 2),
        skipUpdate: false,
      });

      // Update editedText to reflect saved content (important!)
      setEditedText(dataToString(newValue));
      setEditing(false);
    } catch (e) {
      alert("Invalid JSON!");
    }
  };

  const handleCancel = () => {
    // Reset text to latest from store at path
    try {
      const fullJson = JSON.parse(getContents());
      const nodeData = getValueByPath(fullJson, path) ?? {};
      setEditedText(dataToString(nodeData));
    } catch {
      setEditedText("{}");
    }
    setEditing(false);
  };


  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">

          <Group justify="space-between" align="center">
            <Text fz="sm" fw={600} tt="uppercase" c="dimmed">
              Preview
            </Text>
            {editing ? (
              <Group gap="xs">
                <Button size="xs" color="pink" variant = "filled" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" color="pink" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </Group>
            ) : (
              <Button size="xs" color="pink" variant="light" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </Group>

          <ScrollArea.Autosize mah={250} maw={600}>
            
          </ScrollArea.Autosize>

            {editing ? (
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.currentTarget.value)}
                minRows={6}
                autosize
              />
            ) : (
              <CodeHighlight
                code={editedText}
                miw={50}
                maw={600}
                language="json"
                withCopyButton
              />
            )}£™
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
