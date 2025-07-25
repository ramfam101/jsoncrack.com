import React, { useState, useEffect } from "react";
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
  const path = selectedNode?.path || "";
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(dataToString(selectedNode?.text));
  const updateNodeValue = useGraph(state => state.updateNodeValue); // Implement this in your store

  useEffect(() => {
    setEditValue(dataToString(selectedNode?.text));
    setEditMode(false);
  }, [selectedNode, opened]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      updateNodeValue(path, parsed); // Update the node value in your store
      setEditMode(false);
    } catch (e) {
      alert("Invalid JSON format!");
    }
  };

  const handleCancel = () => {
    setEditValue(dataToString(selectedNode?.text));
    setEditMode(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {editMode ? (
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                autosize
                minRows={2}
                maw={600}
              />
            ) : (
              <CodeHighlight code={dataToString(selectedNode?.text)} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          <Group mt="xs">
            {!editMode ? (
              <Button size="xs" onClick={() => setEditMode(true)}>Edit</Button>
            ) : (
              <>
                <Button size="xs" color="green" onClick={handleSave}>Save</Button>
                <Button size="xs" color="red" onClick={handleCancel}>Cancel</Button>
              </>
            )}
          </Group>
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