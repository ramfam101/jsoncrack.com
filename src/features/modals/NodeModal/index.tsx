import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal,  Text,  Group,  Button,  Stack,  ScrollArea,  Textarea,} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph((s) => s.selectedNode);
  const updateNode = useGraph((s) => s.updateNode);

  const [isEditing, setIsEditing] = useState(false);
  const [rawInput, setRawInput] = useState("");

  const getFormattedValue = (value: any) => {
    if (
      Array.isArray(value) &&
      value.every((item) => Array.isArray(item) && item.length === 2)
    ) {
      value = Object.fromEntries(value);
    }
    return typeof value === "object"
      ? JSON.stringify(value, null, 2)
      : String(value ?? "");
  };

  useEffect(() => {
    setRawInput(getFormattedValue(selectedNode?.text));
    setIsEditing(false);
  }, [selectedNode]);

  const handleSave = () => {
    if (!selectedNode) return;
    let parsed: any;

    try {
      parsed = JSON.parse(rawInput);

      if (
        Array.isArray(parsed) &&
        parsed.every((p) => Array.isArray(p) && p.length === 2)
      ) {
        parsed = Object.fromEntries(parsed);
      }

      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        alert('Please enter a valid JSON object like { "key": "value" }.');
        return;
      }
    } catch {
      alert("Invalid JSON. Please fix your syntax.");
      return;
    }

    updateNode(selectedNode.id, parsed);
    useJson.getState().updateJsonByNodeId(selectedNode.id, parsed);

    const updated = useJson.getState().getJson();
    useFile.getState().setContents({
      contents: updated,
      hasChanges: true,
      skipUpdate: true,
    });

    setIsEditing(false);
  };

  const handleCancel = () => {
    setRawInput(getFormattedValue(selectedNode?.text));
    setIsEditing(false);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Node Content" centered>
      <Stack py="sm" gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Content</Text>
          <Group gap="xs">
            {isEditing ? (
              <>
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="default" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="xs" variant="default" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </Group>
        </Group>

        {isEditing ? (
          <Textarea
            autosize
            minRows={6}
            maxRows={10}
            value={rawInput}
            onChange={(e) => setRawInput(e.currentTarget.value)}
            styles={{
              input: {
                fontFamily: "monospace",
                backgroundColor: "#1a1a1a",
                color: "white",
                borderRadius: "6px",
                padding: "12px",
                border: "1px solid #444",
              },
            }}
          />
        ) : (
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight
              code={getFormattedValue(selectedNode?.text)}
              language="json"
              withCopyButton
              styles={{
                root: {
                  backgroundColor: "#1a1a1a",
                  borderRadius: "6px",
                  padding: "12px",
                },
              }}
            />
          </ScrollArea.Autosize>
        )}

        <Text mt="xl" size="sm" color="dimmed">
          JSON Path
        </Text>
        <pre
          style={{
            background: "#1a1a1a",
            color: "white",
            padding: "8px",
            borderRadius: "6px",
            fontFamily: "monospace",
          }}
        >
          {selectedNode?.path ?? "{Root}"}
        </pre>
      </Stack>
    </Modal>
  );
};
