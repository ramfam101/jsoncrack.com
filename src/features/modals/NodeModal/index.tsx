import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) => {
  return JSON.stringify(data, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const node = useGraph(state => state.selectedNode);
  const nodeData = dataToString(node?.text);
  const path = node?.path || "";

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  React.useEffect(() => {
    setEditValue(nodeData);
    setEditing(false);
  }, [nodeData]);

  const updateNode = useGraph(state => state.updateNode);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      updateNode(node.id, parsed);
      setEditing(false);
    } catch {
      alert('Invalid JSON. Please enter valid JSON, e.g. { "name": "orange" }');
    }
  };

  const handleCancel = () => {
    setEditValue(nodeData);
    setEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        {/* Top bar with Edit button aligned right */}
        <Group justify="space-between" align="center" mb="xs">
          <Text fz="xs" fw={500}>Content</Text>
          {!editing && (
            <Button size="xs" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </Group>
        <ScrollArea.Autosize mah={250} maw={600}>
          {editing ? (
            <>
              <textarea
                style={{ width: "100%", minHeight: 120, fontFamily: "monospace" }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
              <Group mt="xs">
                <Button color="green" onClick={handleSave}>Save</Button>
                <Button variant="default" onClick={handleCancel}>Cancel</Button>
              </Group>
            </>
          ) : (
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
          )}
        </ScrollArea.Autosize>
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
