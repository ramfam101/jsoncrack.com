import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, TextInput } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { LuPencil, LuCheck, LuX } from "react-icons/lu";
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
  const json = useJson(state => state.json);
  const setJson = useJson(state => state.setJson);
  const setContents = useFile(state => state.setContents);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (opened && selectedNode) {
      setIsEditing(false);
      setEditValue(nodeData);
    }
  }, [opened, selectedNode, nodeData]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    try {
      console.log("Saving with path:", path);
      console.log("Edit value:", editValue);
      
      // Parse the current JSON
      const jsonObj = JSON.parse(json);
      
      // Simple path parsing - remove {Root} prefix and leading dot
      const cleanPath = path.replace(/^\{Root\}\.?/, "");
      console.log("Clean path:", cleanPath);
      
      const pathParts = cleanPath.split('.').filter(part => part.length > 0);
      console.log("Path parts:", pathParts);
      
      // Navigate to the target location
      let current = jsonObj;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        console.log("Navigating to part:", part, "Current:", current);
        
        if (part.includes('[')) {
          const [key, index] = part.split(/[\[\]]/);
          if (!current[key]) {
            console.error("Key not found:", key);
            alert("Path not found: " + key);
            return;
          }
          current = current[key][parseInt(index)];
        } else {
          if (!current[part]) {
            console.error("Key not found:", part);
            alert("Path not found: " + part);
            return;
          }
          current = current[part];
        }
        
        if (current === undefined) {
          console.error("Path leads to undefined at:", part);
          alert("Invalid path: " + part);
          return;
        }
      }
      
      // Update the value
      const lastPart = pathParts[pathParts.length - 1];
      console.log("Updating last part:", lastPart, "Current:", current);
      
      let parsedValue;
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        // If JSON parsing fails, treat as string
        parsedValue = editValue;
      }
      
      if (lastPart.includes('[')) {
        const [key, index] = lastPart.split(/[\[\]]/);
        if (!current[key]) {
          console.error("Key not found:", key);
          alert("Path not found: " + key);
          return;
        }
        current[key][parseInt(index)] = parsedValue;
      } else {
        if (!(lastPart in current)) {
          console.error("Key not found:", lastPart);
          alert("Path not found: " + lastPart);
          return;
        }
        current[lastPart] = parsedValue;
      }
      
      console.log("Updated JSON:", jsonObj);
      
      // Update both stores
      const newJson = JSON.stringify(jsonObj, null, 2);
      setJson(newJson);
      setContents({ contents: newJson, skipUpdate: true });
      setIsEditing(false);
      
      console.log("Save completed successfully");
    } catch (error) {
      console.error("Error updating JSON:", error);
      alert("Error saving: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(nodeData);
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
                variant="subtle"
                leftSection={<LuPencil size={14} />}
                onClick={handleEdit}
              >
                Edit
              </Button>
            )}
          </Group>
          
          {isEditing ? (
            <Stack gap="xs">
              <TextInput
                value={editValue}
                onChange={(e) => setEditValue(e.currentTarget.value)}
                placeholder="Enter new value..."
                autoFocus
              />
              <Group justify="flex-end" gap="xs">
                <Button size="xs" variant="outline" onClick={handleCancel}>
                  <LuX size={14} />
                  Cancel
                </Button>
                <Button size="xs" onClick={handleSave}>
                  <LuCheck size={14} />
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
