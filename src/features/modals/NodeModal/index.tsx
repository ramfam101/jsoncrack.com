import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Button,
  Group,
  Textarea,
  Code,
  Flex,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph((state) => state.selectedNode);
  const updateSelectedNodeText = useGraph((state) => state.updateSelectedNodeText);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedNode?.text) {
      let text = selectedNode.text;
      try {
        // If it's a string that looks like JSON, parse and format it
        if (typeof text === "string" && text.trim().startsWith("{")) {
          const parsed = JSON.parse(text);
          setDraft(JSON.stringify(parsed, null, 2));
        } else {
          setDraft(JSON.stringify(text, null, 2));
        }
      } catch {
        // Fallback: show as plain string
        setDraft(JSON.stringify(String(text)));
      }
      setIsEditing(false);
      setError(null);
    }
  }, [selectedNode]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(draft.trim());
      updateSelectedNodeText(parsed); // ✅ Must exist in your Zustand store
      setIsEditing(false);
      setError(null);
    } catch (e) {
      setError("Invalid JSON format.");
    }
  };

  const handleCancel = () => {
    if (selectedNode?.text) {
      try {
        setDraft(JSON.stringify(selectedNode.text, null, 2));
      } catch {
        setDraft("");
      }
    }
    setIsEditing(false);
    setError(null);
  };

  if (!selectedNode) return null;

  const path = selectedNode?.path || "";

  return (
    <Modal title="Node Content" size="lg" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Flex justify="space-between" align="center">
          <Text fz="sm" fw={500}>Content</Text>
          {isEditing ? (
            <Group gap="xs">
              <Button size="xs" color="green" onClick={handleSave}>Save</Button>
              <Button size="xs" variant="light" onClick={handleCancel}>Cancel</Button>
            </Group>
          ) : (
            <Button size="xs" variant="light" onClick={() => setIsEditing(true)}>Edit</Button>
          )}
        </Flex>

        {isEditing ? (
          <>
            <Textarea
              autosize
              minRows={6}
              maxRows={12}
              value={draft}
              onChange={(e) => {
                setDraft(e.currentTarget.value);
                setError(null);
              }}
              error={!!error}
            />
            {error && (
              <Text c="red" fz="sm" mt={4}>
                {error}
              </Text>
            )}
          </>
        ) : (
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight
              code={draft}
              miw={350}
              maw={600}
              language="json"
              withCopyButton
            />
          </ScrollArea.Autosize>
        )}

        <Text fw={500} fz="sm" mt="md">JSON Path</Text>
        <Code block>{path}</Code>
      </Stack>
    </Modal>
  );
};
