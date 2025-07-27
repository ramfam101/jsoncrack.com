import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
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
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Check if this is a leaf node (can be edited)
  const isLeafNode = selectedNode && !selectedNode.data.isParent;

  React.useEffect(() => {
    if (opened && selectedNode && isLeafNode) {
      // Initialize edit value when modal opens
      let currentValue = "";
      
      if (typeof selectedNode.text === "string") {
        // For string nodes, just remove quotes
        currentValue = selectedNode.text.replace(/^"(.*)"$/, "$1");
      } else if (Array.isArray(selectedNode.text)) {
        // For array nodes (key-value pairs), convert back to JSON object format
        const entries = selectedNode.text as [string, string][];
        const obj: Record<string, any> = {};
        
        entries.forEach(([key, value]) => {
          // Parse the value to get the correct type
          try {
            obj[key] = JSON.parse(value);
          } catch {
            // If parsing fails, treat as string and remove quotes
            obj[key] = value.replace(/^"(.*)"$/, "$1");
          }
        });
        
        currentValue = JSON.stringify(obj, null, 2);
      } else {
        currentValue = String(selectedNode.text);
      }
      
      setEditValue(currentValue);
    }
  }, [opened, selectedNode, isLeafNode]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const setContents = useFile.getState().setContents;
      const getContents = useFile.getState().getContents;
      const currentContents = getContents();
      const currentJson = JSON.parse(currentContents);
      
      // Parse the edited value
      let newValue: any;
      try {
        // Try to parse as JSON first (for objects, arrays, etc.)
        newValue = JSON.parse(editValue);
      } catch {
        // If JSON parsing fails, treat as string and handle type conversion
        const trimmed = editValue.trim();
        if (trimmed === "") {
          newValue = "";
        } else if (trimmed.toLowerCase() === "true") {
          newValue = true;
        } else if (trimmed.toLowerCase() === "false") {
          newValue = false;
        } else if (trimmed.toLowerCase() === "null") {
          newValue = null;
        } else if (!isNaN(Number(trimmed)) && trimmed !== "") {
          newValue = Number(trimmed);
        } else {
          newValue = trimmed;
        }
      }
      
      console.log("Editing node at path:", path);
      console.log("Old value:", selectedNode?.text);
      console.log("New value:", newValue);
      
      // Update the JSON at the specified path
      const updatedJson = updateValueAtPath(currentJson, path, newValue);
      const updatedJsonString = JSON.stringify(updatedJson, null, 2);
      
      console.log("Updated JSON, updating file contents...");
      
      // Update the file contents - this will trigger all necessary updates
      setContents({ contents: updatedJsonString, hasChanges: true });
      
      console.log("File contents updated successfully!");
      
    } catch (error) {
      console.error("Failed to update node value:", error);
    }
    
    setIsSaving(false);
    setIsEditing(false);
    onClose();
  };

  const updateValueAtPath = (obj: any, path: string, newValue: any): any => {
    console.log("Updating path:", path);
    
    // Create a deep copy
    const result = JSON.parse(JSON.stringify(obj));
    
    // Parse the path to navigate to the correct location
    if (path.startsWith("Root[")) {
      // Handle array root case like "Root[0].name"
      const match = path.match(/Root\[(\d+)\]\.?(.*)/);
      if (match && Array.isArray(result)) {
        const index = parseInt(match[1]);
        const restPath = match[2];
        
        if (!restPath) {
          result[index] = newValue;
        } else {
          result[index] = updateValueAtPath(result[index], restPath, newValue);
        }
      }
    } else if (path.startsWith("{Root}")) {
      // Handle object root case like "{Root}.fruit.name"
      const restPath = path.replace(/^\{Root\}\.?/, "");
      if (!restPath) {
        return newValue;
      } else {
        return updateValueAtPath(result, restPath, newValue);
      }
    } else {
      // Handle nested path navigation
      const parts = path.split(".");
      let current = result;
      
      // Navigate to parent
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (part.includes("[") && part.includes("]")) {
          const [key, indexStr] = part.split("[");
          const index = parseInt(indexStr.replace("]", ""));
          if (key) current = current[key];
          current = current[index];
        } else {
          current = current[part];
        }
      }
      
      // Update the final value
      const finalPart = parts[parts.length - 1];
      if (finalPart.includes("[") && finalPart.includes("]")) {
        const [key, indexStr] = finalPart.split("[");
        const index = parseInt(indexStr.replace("]", ""));
        if (key) {
          current[key][index] = newValue;
        } else {
          current[index] = newValue;
        }
      } else {
        current[finalPart] = newValue;
      }
    }
    
    return result;
  };

  const handleCancel = () => {
    // Reset to original value using the same logic as useEffect
    if (selectedNode && isLeafNode) {
      let currentValue = "";
      
      if (typeof selectedNode.text === "string") {
        currentValue = selectedNode.text.replace(/^"(.*)"$/, "$1");
      } else if (Array.isArray(selectedNode.text)) {
        const entries = selectedNode.text as [string, string][];
        const obj: Record<string, any> = {};
        
        entries.forEach(([key, value]) => {
          try {
            obj[key] = JSON.parse(value);
          } catch {
            obj[key] = value.replace(/^"(.*)"$/, "$1");
          }
        });
        
        currentValue = JSON.stringify(obj, null, 2);
      } else {
        currentValue = String(selectedNode.text);
      }
      
      setEditValue(currentValue);
    }
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditValue("");
    onClose();
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={handleClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing && isLeafNode ? (
            <Stack gap="xs">
              <Text fz="xs" c="dimmed">
                Edit the value below:
              </Text>
              <Textarea
                value={editValue}
                onChange={event => setEditValue(event.currentTarget.value)}
                placeholder="Enter new value"
                style={{ fontFamily: "monospace" }}
                minRows={3}
                maxRows={10}
                autosize
              />
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
        
        {isLeafNode && (
          <Group justify="flex-end" mt="md">
            {isEditing ? (
              <>
                <Button variant="subtle" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={isSaving}>
                  Save
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>
                Edit
              </Button>
            )}
          </Group>
        )}
      </Stack>
    </Modal>
  );
};
