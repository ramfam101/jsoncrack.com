import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, Button, ScrollArea, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useFile from "../../../store/useFile";
import useJson from "../../../store/useJson";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) => {
  // If data is already a string that looks like JSON, return it as is
  if (typeof data === "string" && (data.trim().startsWith("{") || data.trim().startsWith("["))) {
    try {
      // Validate it's valid JSON and return the original string to preserve formatting
      JSON.parse(data);
      return data;
    } catch {
      // If it's not valid JSON, fall through to the original logic
    }
  }
  
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

// Utility function to update JSON object at a specific path
const updateJsonAtPath = (jsonObj: any, path: string, newValue: any): any => {
  if (!path || path === "{Root}") {
    return newValue;
  }

  // Create a copy of the object
  const result = JSON.parse(JSON.stringify(jsonObj));
  
  // Parse the path to get the property path
  let cleanPath = path;
  let current = result;
  
  // Handle Root[index] format - this means we're at the root level
  if (cleanPath.startsWith("Root[")) {
    const match = cleanPath.match(/Root\[(\d+)\]/);
    if (match) {
      const index = parseInt(match[1]);
      if (Array.isArray(result)) {
        // Check if there are more path segments after Root[index]
        if (cleanPath.includes("].")) {
          // It's Root[index].property format, navigate to the array element first
          current = result[index];
          cleanPath = cleanPath.substring(cleanPath.indexOf("]") + 2); // Remove "Root[index]."
        } else {
          // It's just Root[index], replace the entire element
          result[index] = newValue;
          return result;
        }
      }
    }
  }
  
  // Remove {Root} prefix
  if (cleanPath.startsWith("{Root}.")) {
    cleanPath = cleanPath.substring(7); // Remove "{Root}."
  }
  
  if (!cleanPath) {
    return newValue;
  }

  // Parse the path into segments
  const segments: (string | number)[] = [];
  let currentSegment = "";
  let inBracket = false;
  
  for (let i = 0; i < cleanPath.length; i++) {
    const char = cleanPath[i];
    if (char === '[') {
      inBracket = true;
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = "";
      }
    } else if (char === ']') {
      inBracket = false;
      segments.push(parseInt(currentSegment));
      currentSegment = "";
    } else if (char === '.') {
      if (!inBracket && currentSegment) {
        segments.push(currentSegment);
        currentSegment = "";
      } else if (inBracket) {
        currentSegment += char;
      }
    } else {
      currentSegment += char;
    }
  }
  
  if (currentSegment) {
    segments.push(currentSegment);
  }

  // Navigate to the parent of the target property
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    current = current[segment];
  }

  // Set the new value
  const lastSegment = segments[segments.length - 1];
  current[lastSegment] = newValue;

  return result;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const selectedNodeId = useGraph(state => state.selectedNode?.id);
  const updateNodeText = useGraph(state => state.updateNodeText); 
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedData, setEditedData] = React.useState(nodeData);
  const setContents = useFile(state => state.setContents);
  const getJson = useJson(state => state.getJson);

  // Handle modal close - exit edit mode if currently editing
  const handleClose = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditedData(nodeData); // Reset to original data
    }
    onClose();
  };

  React.useEffect(() => {
    if (!isEditing) {
      setEditedData(nodeData);
    }
  }, [nodeData, isEditing]);

  // Reset edit state when modal opens with a different node
  React.useEffect(() => {
    if (opened) {
      setIsEditing(false);
      setEditedData(nodeData);
    }
  }, [opened, nodeData]);

  const handleEdit = () => {
    setEditedData(nodeData);
    setIsEditing(true);
  };

    const handleSave = () => {
    try {
      const parsedNewValue = JSON.parse(editedData);
      if (selectedNodeId) {
        // Format the edited data properly for the node text
        const formattedNodeText = JSON.stringify(parsedNewValue, null, 2);
        
        // Update the node in the graph with properly formatted text
        updateNodeText(selectedNodeId, formattedNodeText);
        
        // Update the JSON in the text editor
        const currentJson = getJson();
        const currentJsonObj = JSON.parse(currentJson);
        const updatedJsonObj = updateJsonAtPath(currentJsonObj, path, parsedNewValue);
        const updatedJsonString = JSON.stringify(updatedJsonObj, null, 2);
        
        // Update the text editor content with proper formatting
        setContents({ contents: updatedJsonString, hasChanges: true, skipUpdate: true });
        
        // Manually trigger the graph update with the formatted JSON
        useJson.getState().setJson(updatedJsonString);
      }
      setIsEditing(false);
    } catch (e) {
      console.error("Invalid JSON format");
    }
  };

  const handleCancel = () => {
    setEditedData(nodeData);
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={handleClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!isEditing ? (
              <Button size="xs" variant="light" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <Group>
                <Button size="xs" variant="filled" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="default" onClick={handleCancel}>
                  Cancel
                </Button>
              </Group>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editedData}
                onChange={e => setEditedData(e.currentTarget.value)}
                minRows={8}
                maxRows={15}
                autosize
                spellCheck={false}
                styles={{ input: { fontFamily: "monospace", fontSize: 13 } }}
                miw={350}
                maw={600}
              />
            ) : (
              <CodeHighlight
                code={nodeData ?? ""}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={path ?? ""}
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
