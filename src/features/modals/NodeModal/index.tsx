import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group } from "@mantine/core";
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
  const nodeText = useGraph(state => state.selectedNode?.text);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(() => dataToString(nodeText));
  const path = useGraph(state => state.selectedNode?.path);
  const updateNodeText = useGraph(state => state.updateNodeText);
  
  React.useEffect(() => {
    if (!editing) setEditValue(dataToString(nodeText));
  }, [nodeText, editing]);

const handleSave = () => {
  try {
    const parsed = JSON.parse(editValue);
    if (path) {
      updateNodeText(path, parsed);
      setEditing(false);
    }
  } catch (e) {
    alert("Invalid JSON format.");
  }
};


  return (
    <Modal
  withCloseButton={false}
  size="auto"
  opened={opened}
  onClose={() => {
    setEditing(false);
    onClose();
  }}
  centered
>
  {/* Custom Header */}
  <Group justify="space-between" align="center" mb="sm">
    <Text fw={500}>Node Content</Text>
    <Group gap="xs">
      <Button
        size="xs"
        variant="light"
        color="gray"
        onClick={() => {
          setEditing(false);
          onClose();
        }}
      >
        ✕
      </Button>
    </Group>
  </Group>

  {/* Modal Body */}
  <Stack py="sm" gap="sm">
    <Stack gap="xs">
  <Group justify="space-between" align="center">
  <Text fz="xs" fw={500}>Content</Text>
  {editing ? (
    <Group gap="xs">
      <Button size="xs" color="green" onClick={handleSave}>Save</Button>
      <Button
        size="xs"
        variant="filled"
        color="gray"
        styles={{
          root: {
            color: 'white',
          }
        }}
        onClick={() => {
          setEditValue(dataToString(nodeText)); // revert to original
          setEditing(false);
        }}
      >
        Cancel
      </Button>
    </Group>
  ) : (
    <Button size="xs" variant="light" onClick={() => setEditing(true)}>Edit</Button>
  )}
</Group>
  <ScrollArea.Autosize mah={250} maw={600}>
    {editing ? (
      <textarea
        style={{
          width: "100%",
          minWidth: 350,
          maxWidth: 600,
          minHeight: 150,
          fontFamily: "monospace",
          fontSize: 14,
          padding: 8,
          borderRadius: 4,
          border: "1px solid #ccc",
          resize: "vertical"
        }}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
      />
    ) : (
      <CodeHighlight code={editValue ?? ""} miw={350} maw={600} language="json" withCopyButton />
    )}
  </ScrollArea.Autosize>
</Stack>
    <Text fz="xs" fw={500}>JSON Path</Text>
    <ScrollArea.Autosize maw={600}>
      <CodeHighlight
        code={path ?? ""}
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
