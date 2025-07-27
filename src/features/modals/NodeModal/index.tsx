import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Button,
  Group,
  Textarea
} from "@mantine/core";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState("");

  const rawText = useGraph(state => state.selectedNode?.text);
  const path = useGraph(state => state.selectedNode?.path || "");

  // Update local editableText state when selectedNode changes
  React.useEffect(() => {
    if (rawText) {
      const json = Array.isArray(rawText)
        ? Object.fromEntries(rawText)
        : rawText;
      setEditableText(JSON.stringify(json, null, 2));
    }
  }, [rawText]);

  return (
    <Modal
      title="Node Content"
      size="auto"
      opened={opened}
      onClose={() => {
        setIsEditing(false);
        onClose();
      }}
      centered
    >
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>

          <ScrollArea.Autosize mah={250} maw={600}>
            {!isEditing ? (
              <CodeHighlight
                code={editableText}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            ) : (
              <Textarea
                autosize
                minRows={6}
                maxRows={20}
                value={editableText}
                onChange={(e) => setEditableText(e.currentTarget.value)}
                style={{ fontFamily: "monospace" }}
              />
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

        {/* Buttons */}
        <Group justify="flex-end" mt="sm">
          {!isEditing ? (
            <Button
              variant="light"
              color="blue"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button variant="default" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                color="blue"
                onClick={() => {
                  console.log("New value:", editableText);
                  setIsEditing(false);
                  // TODO: Save logic goes here (e.g., update Zustand or backend)
                }}
              >
                Save
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};
