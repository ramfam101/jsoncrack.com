import React, { useState, useEffect } from "react";
import { Modal, Stack, Text, ScrollArea, Button } from "@mantine/core";
import type { ModalProps } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

// your original replacer-based JSON → string
const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  return JSON.stringify(text, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(s => s.selectedNode);
  const updateNodeData = useGraph(s => s.updateNodeData);

  const [editableText, setEditableText] = useState("");
  const path = selectedNode?.path || "";

  useEffect(() => {
    if (selectedNode !== null && selectedNode.text) {
      setEditableText(dataToString(selectedNode.text));
    }
  }, [selectedNode]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(editableText);
      const finalData = Array.isArray(selectedNode?.text)
        ? Object.entries(parsed)
        : parsed;
      updateNodeData(selectedNode.id, finalData);
      onClose();
    } catch (err) {
      console.error("Invalid JSON:", err);
      // Optionally show a notification here
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Text fz="xs" fw={500}>Content</Text>
        <ScrollArea.Autosize mah={250} maw={600}>
          <textarea
            value={editableText}
            onChange={e => setEditableText(e.target.value)}
            style={{
              width: "100%",
              minHeight: 200,
              fontFamily: "monospace",
              fontSize: 14
            }}
          />
        </ScrollArea.Autosize>

        <Text fz="xs" fw={500}>JSON Path</Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={path}
            miw={350}
            mah={250}
            language="json"
            withCopyButton
            copyLabel="Copy to clipboard"
            copiedLabel="Copied"
          />
        </ScrollArea.Autosize>

        <Button
          onClick={handleApply}
          variant="light"
          color="gray"
          size="xs"
          fullWidth
        >
          Apply Changes
        </Button>
      </Stack>
    </Modal>
  );
};