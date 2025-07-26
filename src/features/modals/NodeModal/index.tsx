import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea, Alert } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { MdEdit, MdCheck, MdClose, MdWarning } from "react-icons/md";
import useFile from "../../../store/useFile";
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
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const setContents = useFile(state => state.setContents);
  const contents = useFile(state => state.contents);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedNode?.text) {
      setEditedContent(dataToString(selectedNode.text));
    }
  }, [selectedNode?.text]);

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    if (selectedNode?.text) {
      setEditedContent(dataToString(selectedNode.text));
    }
  };

  const updateJsonAtPath = (json: any, nodePath: string, newValue: any): any => {
    if (!nodePath || nodePath === "{Root}") {
      return newValue;
    }

    // Parse the path - handle formats like "{Root}.property" or "Root[0].property[1]"
    const pathStr = nodePath.replace(/^\{Root\}\.?/, "").replace(/^Root\[?\d*\]?\.?/, "");

    if (!pathStr) {
      return newValue;
    }

    const result = JSON.parse(JSON.stringify(json)); // Deep clone

    // Split path by dots, but handle array indices
    const pathParts = pathStr.split(/\.(?![^\[]*\])/).filter(part => part);

    let current = result;

    // Navigate to the parent of the target
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);

      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key][parseInt(index)];
      } else {
        current = current[part];
      }
    }

    // Set the final value
    const finalPart = pathParts[pathParts.length - 1];
    const arrayMatch = finalPart.match(/^(.+)\[(\d+)\]$/);

    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current[key][parseInt(index)] = newValue;
    } else {
      current[finalPart] = newValue;
    }

    return result;
  };

  const handleSave = () => {
    try {
      // Validate JSON
      const parsedContent = JSON.parse(editedContent);

      // Get current JSON from file contents
      const currentJson = JSON.parse(contents);

      // Update the JSON at the specific path
      const updatedJson = updateJsonAtPath(currentJson, path, parsedContent);

      // Update through the file store, which will trigger the graph update
      setContents({
        contents: JSON.stringify(updatedJson, null, 2),
        hasChanges: true,
      });

      // Update the selected node's text to reflect changes immediately in the modal
      if (selectedNode) {
        const updatedNode = {
          ...selectedNode,
          text: Array.isArray(selectedNode.text)
            ? (Object.entries(parsedContent).map(([key, value]) => [key, String(value)]) as [
                string,
                string,
              ][])
            : JSON.stringify(parsedContent, null, 2),
        };
        setSelectedNode(updatedNode);
      }

      setIsEditing(false);
      setError("");
    } catch (err) {
      setError("Invalid JSON format. Please check your syntax.");
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
              <Button
                size="xs"
                variant="light"
                leftSection={<MdEdit size={14} />}
                onClick={handleEdit}
              >
                Edit
              </Button>
            )}
          </Group>

          {error && (
            <Alert icon={<MdWarning size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          {isEditing ? (
            <Stack gap="sm">
              <Textarea
                value={editedContent}
                onChange={event => setEditedContent(event.currentTarget.value)}
                minRows={8}
                maxRows={15}
                autosize
                placeholder="Edit JSON content..."
                styles={{
                  input: {
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: "12px",
                  },
                }}
              />
              <Group justify="flex-end" gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  leftSection={<MdClose size={14} />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button size="xs" leftSection={<MdCheck size={14} />} onClick={handleSave}>
                  Save
                </Button>
              </Group>
            </Stack>
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
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
      </Stack>
    </Modal>
  );
};
