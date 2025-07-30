import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { toast } from "react-hot-toast";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text) || "");
  const path = useGraph(state => state.selectedNode?.path || "");
  const updateNodeContent = useGraph(state => state.updateNodeContent);
  const setGraph = useGraph(state => state.setGraph);

  // Reset edited content when modal opens with new node
  useEffect(() => {
    if (opened && selectedNode) {
      setEditedContent(selectedNode.text as string);
      setIsEditing(false);
    }
  }, [opened, selectedNode]);
  
  const handleSave = () => {
    if (editedContent && selectedNode) {
      updateNodeContent(editedContent.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    setEditedContent(selectedNode?.text as string); 
    setIsEditing(false);
  };
  
  const handleResetToDefault = () => {
    if (!selectedNode || !selectedNode.path) {
      // If no node is selected or it has no path, do nothing
      return;
    }

    try {
      // Get the default JSON object
      const defaultJsonObj = {
        fruit: {
          name: "Apple",
          color: "Red",
          weight: "150g"
        },
        car: {
          model: "Model S",
          year: 2022,
          brand: "Tesla"
        },
        person: {
          name: "Alice",
          occupation: "Engineer",
          age: 30
        }
      };
      
      // Parse the current JSON to modify
      const currentJsonObj = JSON.parse(useJson.getState().json);
      
      // Filter out {Root} and empty segments from the path
      const pathSegments = selectedNode.path
        .split('.')
        .filter(segment => segment !== '{Root}' && segment.length > 0);
      
      if (pathSegments.length === 0) {
        // This is the root node, reset the entire JSON
        const defaultJsonString = JSON.stringify(defaultJsonObj, null, 2);
        useJson.getState().setJson(defaultJsonString);
        useFile.getState().setContents({ 
          contents: defaultJsonString, 
          hasChanges: true,
          skipUpdate: false
        });
        setGraph(defaultJsonString);
        onClose();
        return;
      }
      
      // Navigate to the corresponding path in the default JSON
      let defaultValue = defaultJsonObj;
      let found = true;
      
      for (const segment of pathSegments) {
        if (defaultValue[segment] !== undefined) {
          defaultValue = defaultValue[segment];
        } else {
          // Path doesn't exist in default JSON
          found = false;
          break;
        }
      }
      
      if (!found) {
        toast.error("Cannot reset: This node doesn't exist in the default structure");
        return;
      }
      
      // Update the current JSON with the default value for this node
      let current = currentJsonObj;
      for (let i = 0; i < pathSegments.length - 1; i++) {
        const key = pathSegments[i];
        if (!current[key]) break;
        current = current[key];
      }
      
      const lastSegment = pathSegments[pathSegments.length - 1];
      current[lastSegment] = defaultValue;
      
      // Update the JSON and graph
      const updatedJsonString = JSON.stringify(currentJsonObj, null, 2);
      useJson.getState().setJson(updatedJsonString);
      useFile.getState().setContents({ 
        contents: updatedJsonString, 
        hasChanges: true,
        skipUpdate: false
      });
      setGraph(updatedJsonString);
      
      toast.success("Node reset to default value");
      onClose();
    } catch (error) {
      console.error("Error resetting node to default:", error);
      toast.error("Failed to reset node to default");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              style={{ width: "100%", height: "150px", fontFamily: "monospace" }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          )}
          <Group mt="md" justify="space-between">
            <div>
              {isEditing ? (
                <>
                  <Button color="green" onClick={handleSave} mr="xs">Save Changes</Button>
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                </>
              ) : (
                <Button color="blue" onClick={() => {
                  setEditedContent(selectedNode?.text as string);
                  setIsEditing(true);
                }}>Edit Node Content</Button>
              )}
            </div>
            <Button 
              color="red" 
              variant="outline"
              onClick={handleResetToDefault}
              title="Reset this node to its default value from the sample data"
            >
              Reset to Default
            </Button>
          </Group>
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
