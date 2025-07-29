import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { event as gaEvent } from "nextjs-google-analytics";
import toast from "react-hot-toast";
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

const updateJsonAtPath = (json: any, path: string, newValue: any): any => {
  try {
    // Handle special case where path is just root reference
    if (path === "{Root}" || path === "Root" || !path) {
      return newValue;
    }

    // Parse the path format used by JSON Crack
    // Examples: 
    // {Root}.person.name
    // Root[0].name  
    // {Root}.array[0]
    let workingPath = path;
    
    // Remove root prefix
    workingPath = workingPath.replace(/^\{Root\}\.?/, "");
    workingPath = workingPath.replace(/^Root\[(\d+)\]\.?/, "[$1].");
    workingPath = workingPath.replace(/^Root\.?/, "");
    
    // If no path remains after removing root, replace entire JSON
    if (!workingPath) {
      return newValue;
    }

    const result = JSON.parse(JSON.stringify(json)); // Deep clone
    
    // Split path into segments, handling both dot notation and bracket notation
    const pathSegments: (string | number)[] = [];
    let currentSegment = "";
    let inBrackets = false;
    
    for (let i = 0; i < workingPath.length; i++) {
      const char = workingPath[i];
      
      if (char === '[') {
        if (currentSegment) {
          pathSegments.push(currentSegment);
          currentSegment = "";
        }
        inBrackets = true;
      } else if (char === ']') {
        if (currentSegment) {
          pathSegments.push(parseInt(currentSegment));
          currentSegment = "";
        }
        inBrackets = false;
      } else if (char === '.' && !inBrackets) {
        if (currentSegment) {
          pathSegments.push(currentSegment);
          currentSegment = "";
        }
      } else {
        currentSegment += char;
      }
    }
    
    if (currentSegment) {
      if (inBrackets) {
        pathSegments.push(parseInt(currentSegment));
      } else {
        pathSegments.push(currentSegment);
      }
    }

    // Navigate to the parent and update the target value
    let current = result;
    
    // Navigate to parent
    for (let i = 0; i < pathSegments.length - 1; i++) {
      const segment = pathSegments[i];
      current = current[segment];
      if (current === undefined || current === null) {
        throw new Error(`Path segment '${segment}' not found`);
      }
    }

    // Update the final value
    const finalKey = pathSegments[pathSegments.length - 1];
    current[finalKey] = newValue;

    return result;
  } catch (error) {
    console.error("Error updating JSON at path:", error);
    throw error;
  }
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const setContents = useFile(state => state.setContents);
  const getContents = useFile(state => state.getContents);
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");
  
  // Check if the node is editable (not a parent/container node)
  const isEditable = selectedNode && !selectedNode.data?.isParent;

  React.useEffect(() => {
    if (opened && selectedNode && !selectedNode.data?.isParent) {
      // Initialize edit value with the current node value
      const rawValue = Array.isArray(selectedNode.text) 
        ? JSON.stringify(Object.fromEntries(selectedNode.text), null, 2)
        : typeof selectedNode.text === 'string' 
          ? selectedNode.text.replace(/^"|"$/g, '') // Remove surrounding quotes for strings
          : String(selectedNode.text);
      setEditValue(rawValue);
    }
  }, [opened, selectedNode]);

  const handleEdit = () => {
    setIsEditing(true);
    gaEvent("node_modal_edit_start");
  };

  const handleSave = () => {
    try {
      if (!selectedNode || !path) {
        toast.error("Unable to save: missing node information");
        return;
      }

      // Parse current JSON content
      const currentJson = JSON.parse(getContents());
      
      // Determine the new value based on the original type
      let newValue: any;
      try {
        // Try to parse as JSON first (for objects, arrays, numbers, booleans)
        newValue = JSON.parse(editValue);
      } catch {
        // If parsing fails, treat as string
        newValue = editValue;
      }
      
      // Update the JSON at the specific path
      const updatedJson = updateJsonAtPath(currentJson, path, newValue);
      
      // Update the file contents
      setContents({ 
        contents: JSON.stringify(updatedJson, null, 2),
        hasChanges: true 
      });
      
      setIsEditing(false);
      toast.success("Node updated successfully!");
      gaEvent("node_modal_edit_save");
      onClose();
    } catch (error) {
      console.error("Error saving node:", error);
      toast.error("Failed to save changes. Please check your input format.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original value
    if (selectedNode && !selectedNode.data?.isParent) {
      const rawValue = Array.isArray(selectedNode.text) 
        ? JSON.stringify(Object.fromEntries(selectedNode.text), null, 2)
        : typeof selectedNode.text === 'string' 
          ? selectedNode.text.replace(/^"|"$/g, '')
          : String(selectedNode.text);
      setEditValue(rawValue);
    }
    gaEvent("node_modal_edit_cancel");
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {isEditable && !isEditing && (
              <Button size="xs" variant="light" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </Group>
          
          {isEditing ? (
            <Stack gap="xs">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter new value..."
                minRows={3}
                maxRows={10}
                autosize
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }
                }}
              />
              <Group justify="right" gap="xs">
                <Button size="xs" variant="subtle" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="xs" onClick={handleSave}>
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
