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
  const selectedNode = useGraph(state => state.selectedNode)
  const updateNode = useGraph(state => state.updateNode);

  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");

  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  useEffect(() => {
    if (selectedNode?.text) {
      const content = JSON.stringify(selectedNode.text, null, 2);
      setEditableContent(content);
      setOriginalContent(content);
    }
  }, [selectedNode]);
  
  const handleSave = () => {
    try {
      const parsed = JSON.parse(editableContent);
      updateNode(selectedNode!.id, parsed);
      setIsEditing(false);
      onClose?.();
    } catch (err) {
      alert("Invalid JSON format.");
    }
  };

  const handleCancel = () => {
    setEditableContent(originalContent);
    setIsEditing(false);
    onClose?.();
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Button variant="outline" onClick={() => setIsEditing(true)} size="xs" style={{ alignSelf: "flex-end"}}>
          Edit
        </Button>
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
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
        {isEditing && (
          <Modal
            title="Edit Node Content"
            size="auto"
            opened={isEditing}
            onClose={() => setIsEditing(false)}
            centered
          >
            <Stack py="sm" gap="sm">
              <Text fz="xs" fw={500}>Edit content of the node</Text>
              <textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.currentTarget.value)}
                style={{
                  minHeight: "200px",
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  whiteSpace: "pre-wrap",
                  overflow: "auto",
                }}
              />
            </Stack>
            <Group justify="flex-end">
              <Button color="green" onClick={handleSave}>Save</Button>
              <Button variant="default" onClick={handleCancel}>Cancel</Button>
            </Group>
          </Modal>
        )}
      </Stack>
    </Modal>
  );
};
