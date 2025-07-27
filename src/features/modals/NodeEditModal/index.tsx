import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, TextInput, Button, Group } from "@mantine/core";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

const getNodeValue = (nodeText: string | [string, string][]): string => {
  if (typeof nodeText === "string") {
    return nodeText.replace(/^"(.*)"$/, "$1"); // Remove surrounding quotes
  }
  
  if (Array.isArray(nodeText)) {
    // For array nodes (key-value pairs), get the value part
    // This handles cases like [["name", "Apple"], ["color", "Red"]]
    const entries = nodeText as [string, string][];
    if (entries.length > 0) {
      return entries[0][1]?.replace(/^"(.*)"$/, "$1") || "";
    }
  }
  
  return String(nodeText);
};

export const NodeEditModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const setContents = useFile(state => state.setContents);
  const getContents = useFile(state => state.getContents);
  const path = selectedNode?.path || "";

  const [editValue, setEditValue] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (opened && selectedNode) {
      const currentValue = getNodeValue(selectedNode.text);
      setEditValue(currentValue);
    }
  }, [opened, selectedNode]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const currentContents = getContents();
      const currentJson = JSON.parse(currentContents);
      
      // Convert the edit value to appropriate type
      let newValue: any = editValue.trim();
      if (newValue === "") {
        newValue = "";
      } else if (newValue.toLowerCase() === "true") {
        newValue = true;
      } else if (newValue.toLowerCase() === "false") {
        newValue = false;
      } else if (newValue.toLowerCase() === "null") {
        newValue = null;
      } else if (!isNaN(Number(newValue)) && newValue !== "") {
        newValue = Number(newValue);
      }
      
      console.log("Editing node at path:", path);
      console.log("Old value:", getNodeValue(selectedNode?.text || ""));
      console.log("New value:", newValue);
      
      // Use a simple path-based update approach
      const updatedJson = updateValueAtPath(currentJson, path, newValue);
      const updatedJsonString = JSON.stringify(updatedJson, null, 2);
      
      console.log("Updated JSON, updating file contents...");
      
      // Simply update the file contents - this will trigger all necessary updates
      setContents({ contents: updatedJsonString, hasChanges: true });
      
      console.log("File contents updated successfully!");
      
    } catch (error) {
      console.error("Failed to update node value:", error);
    }
    
    setIsSaving(false);
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
    setEditValue("");
    onClose();
  };

  if (!selectedNode) {
    return null;
  }

  const currentValue = getNodeValue(selectedNode.text);

  return (
    <Modal title="Edit Node Value" size="md" opened={opened} onClose={handleCancel} centered>
      <Stack gap="md">
        <Stack gap="xs">
          <Text fz="sm" fw={500}>
            JSON Path
          </Text>
          <Text fz="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
            {path}
          </Text>
        </Stack>

        <Stack gap="xs">
          <Text fz="sm" fw={500}>
            Current Value
          </Text>
          <Text fz="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
            {currentValue}
          </Text>
        </Stack>

        <Stack gap="xs">
          <Text fz="sm" fw={500}>
            New Value
          </Text>
          <TextInput
            value={editValue}
            onChange={event => setEditValue(event.currentTarget.value)}
            placeholder="Enter new value"
            style={{ fontFamily: "monospace" }}
            onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSave();
              }
            }}
          />
          <Text fz="xs" c="dimmed">
            Tip: Use "true"/"false" for booleans, numbers without quotes, or "null" for null values
          </Text>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};