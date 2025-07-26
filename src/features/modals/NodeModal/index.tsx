import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { toast } from "react-hot-toast";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";
import useJson from "../../../store/useJson";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

// Utility function to update JSON at a specific path
const updateJsonAtPath = (jsonObject: any, path: string, newValue: any): any => {
  const pathParts = path
    .replace(/^\{Root\}\.?/, "") // Remove {Root} prefix
    .replace(/^Root\[(\d+)\]\.?/, (_, index) => `[${index}].`) // Handle Root[0] format
    .split(/\.|\[|\]/) // Split by dots and brackets
    .filter(part => part !== "" && part !== undefined); // Remove empty parts

  if (pathParts.length === 0) {
    return newValue;
  }

  const result = JSON.parse(JSON.stringify(jsonObject)); // Deep clone
  let current = result;

  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    const isArrayIndex = /^\d+$/.test(part);
    
    if (isArrayIndex) {
      const index = parseInt(part, 10);
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at path segment: ${part}`);
      }
      current = current[index];
    } else {
      if (typeof current !== "object" || current === null) {
        throw new Error(`Expected object at path segment: ${part}`);
      }
      current = current[part];
    }
  }

  const lastPart = pathParts[pathParts.length - 1];
  const isArrayIndex = /^\d+$/.test(lastPart);
  
  if (isArrayIndex) {
    const index = parseInt(lastPart, 10);
    if (!Array.isArray(current)) {
      throw new Error(`Expected array at final path segment: ${lastPart}`);
    }
    current[index] = newValue;
  } else {
    if (typeof current !== "object" || current === null) {
      throw new Error(`Expected object at final path segment: ${lastPart}`);
    }
    current[lastPart] = newValue;
  }

  return result;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const [editContentModalOpened, setEditContentModalOpened] = useState(false);

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
          </ScrollArea.Autosize>
        </Stack>
        <Button onClick={() => setEditContentModalOpened(true)}>Edit Content</Button>
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
      <EditContentModal 
        opened={editContentModalOpened} 
        onClose={() => { 
          setEditContentModalOpened(false); 
          onClose(); 
        }} 
      />
    </Modal>
  );
};

const EditContentModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const [nodeData, setNodeData] = useState(useGraph(state => dataToString(state.selectedNode?.text)));
  const currentJson = useJson(state => state.json);
  const setContents = useFile(state => state.setContents);
  
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodeData(event.target.value);
  };

  const handleSave = async () => {
    try {
      if (!selectedNode?.path) {
        toast.error("No path available for this node");
        return;
      }

      // Parse the edited content
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(nodeData);
      } catch {
        // If it's not valid JSON, treat it as a string value
        parsedValue = nodeData.replace(/^"/, "").replace(/"$/, ""); // Remove surrounding quotes if present
      }

      // Parse the current JSON
      const currentJsonObject = JSON.parse(currentJson);
      
      // Update the JSON at the specific path
      const updatedJson = updateJsonAtPath(currentJsonObject, selectedNode.path, parsedValue);
      
      // Convert back to string and update
      const updatedJsonString = JSON.stringify(updatedJson, null, 2);
      
      // Update the file contents which will trigger the update flow
      await setContents({ contents: updatedJsonString, hasChanges: true });
      
      toast.success("Node updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating node:", error);
      toast.error(`Failed to update node: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <Modal title="Edit Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Text fz="xs" fw={500} c="dimmed">
          Path: {selectedNode?.path}
        </Text>
        <Textarea 
          value={nodeData} 
          autosize 
          minRows={3}
          maxRows={10}
          onChange={handleChange}
          placeholder="Enter the new value for this node..."
        />
        <Button onClick={handleSave}>Save Changes</Button>
      </Stack>
    </Modal>
  );
};
