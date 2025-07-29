import React, { useEffect, useState } from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Button,
  Textarea,
  Group,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

// Converts object/array to clean JSON string
const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };
  return JSON.stringify(text, replacer, 2);
};

// Set a deep value in an object from a dot-separated path
const setDeepValue = (obj: any, path: string, value: any): boolean => {
  let cleanedPath = path.trim();

  const rootPrefix = "{Root}";
  if (cleanedPath.startsWith(rootPrefix)) {
    cleanedPath = cleanedPath.slice(rootPrefix.length);
  }

  if (cleanedPath.startsWith(".")) {
    cleanedPath = cleanedPath.slice(1);
  }

  if (!cleanedPath) {
    Object.keys(obj).forEach((key) => delete obj[key]);
    Object.assign(obj, value);
    return true;
  }

  const keys = cleanedPath.split(".");

  let curr = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in curr) || typeof curr[keys[i]] !== "object") {
      curr[keys[i]] = {};
    }
    curr = curr[keys[i]];
  }

  curr[keys[keys.length - 1]] = value;
  return true;
};

// Helper: get nested value by path from object
const getValueByPath = (obj: any, path: string) => {
  let cleanedPath = path.trim();

  const rootPrefix = "{Root}";
  if (cleanedPath.startsWith(rootPrefix)) {
    cleanedPath = cleanedPath.slice(rootPrefix.length);
  }
  if (cleanedPath.startsWith(".")) {
    cleanedPath = cleanedPath.slice(1);
  }
  if (!cleanedPath) {
    return obj;
  }

  const keys = cleanedPath.split(".");
  let curr = obj;
  for (const key of keys) {
    if (curr && key in curr) {
      curr = curr[key];
    } else {
      return undefined;
    }
  }
  return curr;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph((state) => state.selectedNode);
  const path = selectedNode?.path || "";

  const setContents = useFile((state) => state.setContents);
  const getContents = useFile.getState().getContents;

  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState("{}");

  // On modal open or when path changes, update editedText with fresh content from file store
  useEffect(() => {
    if (opened) {
      try {
        const fullJson = JSON.parse(getContents());
        const nodeData = getValueByPath(fullJson, path) ?? {};
        setEditedText(dataToString(nodeData));
        setEditing(false);
      } catch {
        setEditedText("{}");
        setEditing(false);
      }
    }
  }, [opened, path, getContents]);

  const handleSave = () => {
    try {
      const updatedValue = JSON.parse(editedText);
      const fullJson = JSON.parse(getContents());

      if (!path) {
        alert("No JSON path provided.");
        return;
      }

      const success = setDeepValue(fullJson, path, updatedValue);
      if (!success) {
        alert("Invalid path: " + path);
        return;
      }

      const updatedContents = JSON.stringify(fullJson, null, 2);
      setContents({
        contents: updatedContents,
        skipUpdate: false,
      });

      // Update editedText to reflect saved content (important!)
      setEditedText(dataToString(updatedValue));
      setEditing(false);
    } catch (e) {
      alert("Invalid JSON. Please fix the syntax before saving.");
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
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {editing ? (
              <Group gap="xs">
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="default" onClick={handleCancel}>
                  Cancel
                </Button>
              </Group>
            ) : (
              <Button size="xs" variant="light" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </Group>

          <ScrollArea.Autosize mah={250} maw={600}>
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
                miw={350}
                maw={600}
                language="json"
                withCopyButton
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
