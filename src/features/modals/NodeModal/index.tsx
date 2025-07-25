import React, { useState, useEffect } from "react";
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
  const selectedNode = useGraph(state => state.selectedNode);
  const updateNode = useGraph(state => state.updateNode); // Ensure this exists in your store
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState("");
  const path = selectedNode?.path || "";

  useEffect(() => {
    setContent(
      selectedNode?.text
        ? JSON.stringify(selectedNode.text, null, 2)
        : ""
    );
    setEditMode(false);
  }, [selectedNode, opened]);

  const handleSave = () => {
  const parsed = JSON.parse(content);
  updateNode({ ...selectedNode, text: parsed });
  setEditMode(false);
};

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {editMode ? (
              <textarea
                style={{ width: "100%", minHeight: 150, fontFamily: "monospace" }}
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            ) : (
              <CodeHighlight code={content} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          <Group mt="xs">
            {editMode ? (
              <>
                <Button size="xs" color="green" onClick={handleSave}>Save</Button>
                <Button size="xs" variant="default" onClick={() => setEditMode(false)}>Cancel</Button>
              </>
            ) : (
              <Button size="xs" onClick={() => setEditMode(true)}>Edit</Button>
            )}
          </Group>
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