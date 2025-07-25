import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };
  return JSON.stringify(text, replacer, 2);
};

// Utility function to update JSON at a given path (supports nested objects/arrays)
const updateJsonAtPath = (obj: any, path: string, value: any) => {
  if (!path) return value; // If path is empty, replace the whole object

  // Example path: "fruit" or "car/model"
  const keys = path.split("/").filter(Boolean);
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // If the key doesn't exist, create an object or array
    if (current[key] === undefined) {
      // Try to detect if next key is a number (array index)
      const nextKey = keys[i + 1];
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
  return obj;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = dataToString(selectedNode?.text);
  const path = selectedNode?.path || "";
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);
  const [refreshCount, setRefreshCount] = useState(0);
  // Removed: setNodeText is not defined in the store

  const setContents = useFile(state => state.setContents);

  React.useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
  }, [nodeData, opened]);

  const sanitizePath = (path: string) => {
    return path.replace(/^\{Root\}\./, "");
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);

      const rootJson = useFile.getState().contents;
      const rootObj = JSON.parse(rootJson);

      const cleanPath = sanitizePath(path);
      const updatedJson = updateJsonAtPath(rootObj, cleanPath, parsed);

      useFile.getState().setContents({ contents: JSON.stringify(updatedJson, null, 2) });
      // useGraph.getState().setNodeText(parsed);
      setSelectedNode({
        ...selectedNode,
        id: selectedNode?.id ?? "", // Ensure id is always a string
        text: parsed,
        width: selectedNode?.width ?? 0,
        height: selectedNode?.height ?? 0,
        path: selectedNode?.path ?? "",
        data: selectedNode?.data ?? {
          type: 'object', // Replace with a valid NodeType
          isParent: false,
          isEmpty: false,
          childrenCount: 0,
        },
      });
      // Just exit edit mode; the modal will rerender and show the latest value from the store
      setIsEditing(false);
    } catch (err) {
      // Optionally show error
    }
  };

  return (
    <Modal
      key={refreshCount}
      title="Node Content"
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
    >
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>Content</Text>
            {isEditing ? (
              <Group gap={4}>
                <Button color="green" size="xs" onClick={() => {handleSave(); setIsEditing(false);}}>Save</Button>
                <Button variant="default" size="xs" onClick={() => {
                  setEditValue(dataToString(selectedNode?.text)); // Reset to latest value
                  setIsEditing(false);
                }}>Cancel</Button>
              </Group>
            ) : (
              <Button size="xs" onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                autosize
                minRows={6}
                maxRows={12}
                maw={600}
                miw={350}
                styles={{ input: { fontFamily: "monospace" } }}
              />
            ) : (
              <CodeHighlight code={dataToString(selectedNode?.text)} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
        </Stack>
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
