import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import toast from "react-hot-toast";
import { MdEdit, MdSave, MdCancel } from "react-icons/md";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";
import useJson from "../../../store/useJson";
import { updateJsonValueAtPath, parseValueFromString } from "../../../lib/utils/jsonPathUtils";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedValue, setEditedValue] = React.useState("");
  
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const selectedNode = useGraph(state => state.selectedNode);
  const getJson = useJson(state => state.getJson);
  const setContents = useFile(state => state.setContents);

  // Reset editing state when modal opens/closes or node changes
  React.useEffect(() => {
    if (opened && selectedNode) {
      setIsEditing(false);
      setEditedValue(nodeData);
    }
  }, [opened, selectedNode, nodeData]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedValue(nodeData);
  };

  const handleSave = () => {
    try {
      if (!selectedNode?.path) {
        toast.error("Cannot edit node without path information");
        return;
      }

      // Parse the current JSON
      const currentJson = JSON.parse(getJson());
      
      // Parse the new value from the text editor
      const newValue = parseValueFromString(editedValue.trim());
      
      // Update the JSON at the specified path
      const updatedJson = updateJsonValueAtPath(currentJson, selectedNode.path, newValue);
      
      // Update both the file contents and the JSON store
      const updatedJsonString = JSON.stringify(updatedJson, null, 2);
      setContents({ contents: updatedJsonString });
      
      setIsEditing(false);
      toast.success("Value updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating node value:", error);
      toast.error("Failed to update value. Please check the format.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedValue(nodeData);
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
          
          {isEditing ? (
            <Stack gap="xs">
              <Textarea
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                minRows={4}
                maxRows={10}
                autosize
                placeholder="Enter new value..."
                style={{ fontFamily: 'monospace' }}
              />
              <Group justify="flex-end" gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  leftSection={<MdCancel size={14} />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  leftSection={<MdSave size={14} />}
                  onClick={handleSave}
                >
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
