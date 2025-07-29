import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const path = useGraph(state => state.selectedNode?.path || "");
  const updateNodeText = useGraph(state => state.updateNodeText);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    setEditValue(selectedNode?.text ? JSON.stringify(selectedNode.text, null, 2) : "");
    setEditing(false);
  }, [selectedNode]);

  const handleSave = () => {
    if (selectedNode && updateNodeText) {
      try {
        const parsed = JSON.parse(editValue);
        updateNodeText(selectedNode.id, parsed);
        setEditing(false);
      } catch (e) {
        alert("Invalid JSON format.");
      }
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Group position="right">
          {editing ? (
            <>
              <Button size="xs" variant="light" onClick={handleSave}>
                Save
              </Button>
              <Button size="xs" variant="default" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} size="xs" variant="light">
              Edit
            </Button>
          )}
        </Group>
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {editing ? (
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                minRows={6}
                autosize
                style={{ minWidth: 350, maxWidth: 600 }}
              />
            ) : (
              <CodeHighlight
                code={selectedNode?.text ? JSON.stringify(selectedNode.text, null, 2) : ""}
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
