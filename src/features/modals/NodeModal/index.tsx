import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const selectedNode = useGraph(state => state.selectedNode);
  const setJson = useJson(state => state.setJson);
  const getJson = useJson(state => state.getJson);
  const setContents = useFile(state => state.setContents);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(nodeData);
  const [error, setError] = useState<string | null>(null);

  // Update edited content when node changes
  React.useEffect(() => {
    setEditedContent(nodeData);
    setError(null);
  }, [nodeData]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(nodeData);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(nodeData);
    setError(null);
  };

  const handleSave = () => {
    try {
      // Validate JSON
      const parsedContent = JSON.parse(editedContent);
      
      // Update the JSON in the store
      const currentJson = JSON.parse(getJson());
      
      // Parse the path to update the correct location
      const pathParts = path.replace('{Root}', '').split('.').filter(Boolean);
      let current = currentJson;
      
      // Navigate to the parent of the target node
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part.includes('[')) {
          const arrayName = part.split('[')[0];
          const index = parseInt(part.split('[')[1].split(']')[0]);
          current = current[arrayName][index];
        } else {
          current = current[part];
        }
      }
      
      // Update the node value
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.includes('[')) {
        const arrayName = lastPart.split('[')[0];
        const index = parseInt(lastPart.split('[')[1].split(']')[0]);
        current[arrayName][index] = parsedContent;
      } else {
        current[lastPart] = parsedContent;
      }
      
      // Update both stores
      const updatedJson = JSON.stringify(currentJson, null, 2);
      setJson(updatedJson);
      setContents({ contents: updatedJson });
      
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError("Invalid JSON format");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!isEditing && (
              <Button size="xs" variant="light" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.currentTarget.value)}
                minRows={8}
                maxRows={12}
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }
                }}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          {error && (
            <Text size="xs" c="red">
              {error}
            </Text>
          )}
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
          <Group justify="flex-end" gap="xs">
            <Button size="xs" variant="light" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="xs" color="green" onClick={handleSave}>
              Save
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};
