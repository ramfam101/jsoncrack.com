import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";

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
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const selectedNode = useGraph(state => state.selectedNode);
  const graph = useGraph();
  const currentJson = useJson(state => state.json);
  const setJson = useJson(state => state.setJson);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(nodeData);

  useEffect(() => {
    if (!isEditing) {
      setEditedContent(nodeData);
    }
  }, [nodeData, isEditing]);
  const updateJsonAtPath = (json: string | undefined, path: string, newValue: any) => {
    if (!json) return { success: false, error: "No JSON content to update" };
    
    try {
      const obj = JSON.parse(json);
      
      // If path is empty, root, or references root directly, update the entire JSON
      if (!path || path === "$" || path === "{Root}") {
        return { success: true, result: JSON.stringify(newValue, null, 2) };
      }

      // Clean up path by removing root references and initial dot
      const cleanPath = path.replace(/^\$\.?/, "").replace(/^{Root}\.?/, "");
      if (!cleanPath) {
        return { success: true, result: JSON.stringify(newValue, null, 2) };
      }

      const parts = cleanPath.split(".");
      let current = obj;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i].replace(/\[\d+\]/, "");
        const arrayMatch = parts[i].match(/\[(\d+)\]/);
        if (arrayMatch) {
          if (!current[part] || !Array.isArray(current[part])) {
            throw new Error(`Invalid array path at ${part}`);
          }
          current = current[part][parseInt(arrayMatch[1])];
        } else {
          current = current[part];
        }
        
        if (current === undefined) {
          throw new Error(`Path segment not found: ${part}`);
        }
      }

      // Handle the last part
      const lastPart = parts[parts.length - 1].replace(/\[\d+\]/, "");
      const lastArrayMatch = parts[parts.length - 1].match(/\[(\d+)\]/);
      
      if (lastArrayMatch) {
        if (!current[lastPart] || !Array.isArray(current[lastPart])) {
          throw new Error(`Invalid array at ${lastPart}`);
        }
        current[lastPart][parseInt(lastArrayMatch[1])] = newValue;
      } else {
        current[lastPart] = newValue;
      }

      return { success: true, result: JSON.stringify(obj, null, 2) };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to update JSON" 
      };
    }
  };

  const handleSave = () => {
    try {
      if (!currentJson || !path) {
        throw new Error("Missing required data");
      }

      const parsedValue = JSON.parse(editedContent);
      const update = updateJsonAtPath(currentJson, path, parsedValue);
      
      if (!update.success) {
        throw new Error(update.error);
      }
      
      if (selectedNode) {
        // This will trigger both graph and file content updates
        setJson(update.result);
        setSelectedNode({ ...selectedNode, text: parsedValue });
        setIsEditing(false);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleCancel = () => {
    setEditedContent(nodeData);
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Group justify="space-between">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {!isEditing && (
            <Button size="xs" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </Group>
        {isEditing ? (
          <>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.currentTarget.value)}
              autosize
              minRows={5}
              maxRows={10}
            />
            <Group justify="space-between" mt="sm">
              <Button size="xs" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="xs" onClick={handleSave}>
                Save
              </Button>
            </Group>
          </>
        ) : (
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
          </ScrollArea.Autosize>
        )}
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
