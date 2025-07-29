import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea, ActionIcon, Tooltip } from "@mantine/core";
import { MdEdit } from "react-icons/md";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };
  return JSON.stringify(text, replacer, 2);
};

// Helper: Parse path like "{Root}.user.settings[0].name" to array of keys
function parsePath(path: string): (string | number)[] {
  // Remove {Root}. prefix if present
  path = path.replace(/^\{Root\}\./, "");
  const regex = /([^[.\]]+)|\[(\d+)\]/g;
  const keys: (string | number)[] = [];
  let match;
  while ((match = regex.exec(path))) {
    if (match[1]) keys.push(match[1]);
    else if (match[2]) keys.push(Number(match[2]));
  }
  return keys;
}

// Helper: Set value at path in object (immutably)
function setValueAtPath(obj: any, path: (string | number)[], value: any) {
  if (!path.length) return value;
  const [key, ...rest] = path;
  if (Array.isArray(obj)) {
    const arr = [...obj];
    arr[key as number] = setValueAtPath(arr[key as number], rest, value);
    return arr;
  } else {
    return {
      ...obj,
      [key]: setValueAtPath(obj?.[key], rest, value),
    };
  }
}

// Helper: Get value at path from object
function getValueAtPath(obj: any, path: (string | number)[]) {
  return path.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const node = useGraph(state => state.selectedNode);
  const nodeData = dataToString(node?.text);
  const path = node?.path || "";

  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);
  const [lastSavedValue, setLastSavedValue] = useState(nodeData);
  const [isValid, setIsValid] = useState(true);

  const setJson = useJson(state => state.setJson);
  const setContents = useFile(state => state.setContents);
  const json = useJson(state => state.json);

  // Reset edit state when modal opens or node changes
  React.useEffect(() => {
    setEditMode(false);
    setEditValue(nodeData);
    setLastSavedValue(nodeData);
    setIsValid(true);
  }, [opened, nodeData]);
  // Validate JSON on edit
  const handleEditChange = (val: string) => {
    setEditValue(val);
    try {
      JSON.parse(val);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  };

  // Save handler
  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      const keys = parsePath(path);
      const jsonObj = JSON.parse(json);
      const updatedJson = setValueAtPath(jsonObj, keys, parsed);
      const updatedJsonStr = JSON.stringify(updatedJson, null, 2);
      setJson(updatedJsonStr);
      setContents({ contents: updatedJsonStr });
      setEditMode(false);

      // Recompute node data from updated JSON and update editValue
      const newNodeValue = getValueAtPath(updatedJson, keys);
      const newValue = JSON.stringify(newNodeValue, null, 2);
      setEditValue(newValue);
      setLastSavedValue(newValue); // update lastSavedValue
    } catch {
      setIsValid(false);
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
            {!editMode && (
              <Tooltip label="Edit">
                <ActionIcon size="sm" variant="light" onClick={() => setEditMode(true)}>
                  <MdEdit size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {!editMode ? (
              <CodeHighlight code={editValue} miw={350} maw={600} language="json" withCopyButton />
            ) : (
              <Stack gap="xs">
                <Textarea
                  value={editValue}
                  onChange={e => handleEditChange(e.currentTarget.value)}
                  minRows={6}
                  autosize
                  error={!isValid ? "Invalid JSON" : undefined}
                  styles={{ input: { fontFamily: "monospace" } }}
                />
                <Group gap="xs">
                  <Button size="xs" onClick={handleSave} disabled={!isValid}>
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="gray"
                    onClick={() => {
                      setEditMode(false);
                      setEditValue(lastSavedValue); // revert to last saved value
                      setIsValid(true);
                    }}
                  >
                    Cancel
                  </Button>
                </Group>
              </Stack>
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
