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
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const formatDataToString = (data: any) => {
  // Converts array of pairs to object and removes quotes from string values
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: any) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };
  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState("");

  const selectedNode = useGraph(state => state.selectedNode);
  const updateNodeText = useGraph(state => state.updateNodeText);

  const path = selectedNode?.path || "";

  // Initialize editable text when selected node changes
  useEffect(() => {
    if (selectedNode?.text) {
      const json = Array.isArray(selectedNode.text)
        ? Object.fromEntries(selectedNode.text)
        : selectedNode.text;
      setEditableText(JSON.stringify(json, null, 2));
    } else {
      setEditableText("");
    }
  }, [selectedNode]);

  // Handler for save button
  const handleSave = () => {
    try {
      const parsed = JSON.parse(editableText);

      // If parsed is object, convert back to expected format if needed
      let newText: string | [string, string][];
      if (typeof parsed === "object" && !Array.isArray(parsed)) {
        // Convert object back to [key, value][] if original was an array of pairs
        if (Array.isArray(selectedNode?.text)) {
          newText = Object.entries(parsed);
        } else {
          newText = parsed;
        }
      } else {
        newText = parsed;
      }

      if (selectedNode) {
        updateNodeText(selectedNode.id, newText);
      }
      setIsEditing(false);
    } catch (error) {
      alert("Invalid JSON format. Please correct and try again.");
    }
  };

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
                onChange={e => setEditableText(e.currentTarget.value)}
                style={{ fontFamily: "monospace" }}
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

        {/* Buttons */}
        <Group justify="flex-end" mt="sm">
          {!isEditing ? (
            <Button variant="light" color="blue" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="default" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button color="blue" onClick={handleSave}>
                Save
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};
