import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../../src/store/useFile";
import useJson from "../../../../src/store/useJson";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };
  return JSON.stringify(text, replacer, 2);
};

const updateOriginalJson = (path: string, newValue: any) => {
  try {
    const currentJson = useJson.getState().json;
    const parsedJson = JSON.parse(currentJson);
    
    const pathSegments = path.replace('{Root}.', '').split('.');
    let current = parsedJson;
    
    for (let i = 0; i < pathSegments.length - 1; i++) {
      const segment = pathSegments[i];
      if (current[segment] === undefined) {
        current[segment] = {};
      }
      current = current[segment];
    }
    
    const lastSegment = pathSegments[pathSegments.length - 1];
    current[lastSegment] = newValue;
    
    const updatedJsonString = JSON.stringify(parsedJson, null, 2);
    useFile.getState().setContents({ 
      contents: updatedJsonString, 
      hasChanges: true,
    });
    useJson.getState().setJson(updatedJsonString);
    
    return true;
  } catch (error) {
    console.error("Failed to update original JSON:", error);
    return false;
  }
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(nodeData);

  useEffect(() => {
    if (opened) {
      setEditedContent(nodeData ?? "");
      setIsEditing(false);
    }
  }, [opened, nodeData]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedContent);
      
      useGraph.getState().updateNode?.(path, parsed);
      updateOriginalJson(path, parsed);
      
      setIsEditing(false);
      setEditedContent(dataToString(parsed));
      onClose();
    } catch (e) {
      console.error("Invalid JSON format", e);
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {isEditing ? (
              <Group align="center">
                <Button onClick={handleSave}>
                  Save
                </Button>
                <Button variant="subtle" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </Group>
            ) : (
              <Button onClick={() => {
                setEditedContent(nodeData ?? "");
                setIsEditing(true);
              }}>
                Edit
              </Button>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editedContent ?? ""}
                onChange={event => setEditedContent(event.currentTarget.value)}
                minRows={8}
                autosize
                styles={{ 
                  input: { 
                    fontFamily: "monospace", 
                    fontSize: 14,
                    whiteSpace: "pre"
                  } 
                }}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
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