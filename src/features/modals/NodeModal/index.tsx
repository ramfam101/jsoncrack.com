import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import toast from "react-hot-toast";
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const selectedNode = useGraph(state => state.selectedNode);
  const setContents = useFile(state => state.setContents);
  const getContents = useFile(state => state.getContents);

  // Initialize edited content when modal opens or nodeData changes
  React.useEffect(() => {
    if (nodeData && !isEditMode) {
      setEditedContent(nodeData);
    }
  }, [nodeData, isEditMode]);

  const handleToggleEdit = () => {
    if (!isEditMode) {
      setEditedContent(nodeData);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSave = async () => {
    try {
      if (!selectedNode) {
        toast.error("No node selected");
        return;
      }

      // Get the current file contents
      const currentContents = getContents();
      let currentJson;
      try {
        currentJson = JSON.parse(currentContents);
      } catch (error) {
        toast.error("Invalid JSON in current file");
        return;
      }

      const nodePath = selectedNode.path;
      
      if (!nodePath || nodePath === "{Root}") {
        // Root level update - parse as JSON
        try {
          currentJson = JSON.parse(editedContent);
        } catch (error) {
          toast.error("Invalid JSON format");
          return;
        }
      } else {
        // Check if this is a property key (editing a property name)
        const isPropertyKey = selectedNode.data?.type === "property" || 
                             (typeof selectedNode.text === "string" && 
                              selectedNode.text === selectedNode.text.replace(/[:"{}[\]]/g, ""));

        if (isPropertyKey) {
          // This is editing a property key name - remove any surrounding quotes
          const cleanKey = editedContent.trim().replace(/^"(.*)"$/, '$1');
          const updatedJson = updatePropertyKey(currentJson, nodePath, cleanKey);
          if (updatedJson === null) {
            toast.error("Failed to update property key - invalid path");
            return;
          }
          currentJson = updatedJson;
        } else {
          // This is editing a property value
          let parsedContent;
          try {
            parsedContent = JSON.parse(editedContent);
          } catch (error) {
            toast.error("Invalid JSON format");
            return;
          }

          const updatedJson = updateJsonAtPath(currentJson, nodePath, parsedContent);
          if (updatedJson === null) {
            toast.error("Failed to update node - invalid path");
            return;
          }
          currentJson = updatedJson;
        }
      }

      // Update the file contents
      await setContents({ 
        contents: JSON.stringify(currentJson, null, 2),
        hasChanges: true 
      });

      // Force graph regeneration by calling setGraph
      const setGraph = useGraph.getState().setGraph;
      setGraph(JSON.stringify(currentJson, null, 2));

      toast.success("Node updated successfully");
      setIsEditMode(false);
      onClose();
    } catch (error) {
      console.error("Error saving node:", error);
      toast.error(`Failed to save changes: ${error.message}`);
    }
  };

  // Helper function to update a property key name
  const updatePropertyKey = (json: any, path: string, newKey: string): any => {
    try {
      // Remove {Root} prefix if present
      let cleanPath = path.replace(/^\{Root\}\.?/, '');
      
      if (!cleanPath) {
        return null; // Can't rename root
      }

      // Split path into segments
      const segments = cleanPath.split(/\.(?![^\[]*\])/).filter(Boolean);
      
      // Create a deep copy to avoid mutating the original
      const result = JSON.parse(JSON.stringify(json));
      let current = result;
      
      // Navigate to the parent object that contains the key to rename
      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
        
        if (arrayMatch) {
          const [, key, index] = arrayMatch;
          if (!(key in current) || !Array.isArray(current[key])) {
            return null;
          }
          current = current[key][parseInt(index)];
        } else {
          if (!(segment in current)) {
            return null;
          }
          current = current[segment];
        }
      }
      
      // Get the old key name and rename it
      const oldKey = segments[segments.length - 1];
      
      if (typeof current !== 'object' || current === null || Array.isArray(current)) {
        return null; // Can't rename keys in non-objects
      }
      
      if (!(oldKey in current)) {
        return null; // Old key doesn't exist
      }
      
      // Store the value and delete the old key
      const value = current[oldKey];
      delete current[oldKey];
      
      // Set the new key with the same value
      current[newKey] = value;
      
      return result;
    } catch (error) {
      console.error("Error updating property key:", error);
      return null;
    }
  };

  // Helper function to update JSON at a specific path (for values)
  const updateJsonAtPath = (json: any, path: string, newValue: any): any => {
    try {
      // Remove {Root} prefix if present
      let cleanPath = path.replace(/^\{Root\}\.?/, '');
      
      if (!cleanPath) {
        return newValue; // Root update
      }

      // Split path into segments, handling array indices
      const segments = cleanPath.split(/\.(?![^\[]*\])/).filter(Boolean);
      
      // Create a deep copy to avoid mutating the original
      const result = JSON.parse(JSON.stringify(json));
      let current = result;
      
      // Navigate to the parent of the target
      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
        
        if (arrayMatch) {
          const [, key, index] = arrayMatch;
          if (!(key in current) || !Array.isArray(current[key])) {
            return null;
          }
          current = current[key][parseInt(index)];
        } else {
          if (!(segment in current)) {
            return null;
          }
          current = current[segment];
        }
      }
      
      // Update the final segment
      const lastSegment = segments[segments.length - 1];
      const arrayMatch = lastSegment.match(/^(.+)\[(\d+)\]$/);
      
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        if (!(key in current) || !Array.isArray(current[key])) {
          return null;
        }
        current[key][parseInt(index)] = newValue;
      } else {
        current[lastSegment] = newValue;
      }
      
      return result;
    } catch (error) {
      console.error("Error updating JSON at path:", error);
      return null;
    }
  };

  const handleCancel = () => {
    setEditedContent(nodeData);
    setIsEditMode(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Button
              size="xs"
              variant={isEditMode ? "light" : "outline"}
              onClick={handleToggleEdit}
            >
              {isEditMode ? "View" : "Edit"}
            </Button>
          </Group>
          
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditMode ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.currentTarget.value)}
                minRows={10}
                autosize
                styles={{
                  input: {
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '12px',
                  }
                }}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          
          {isEditMode && (
            <Group gap="xs">
              <Button size="xs" onClick={handleSave}>
                Save
              </Button>
              <Button size="xs" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </Group>
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