import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group } from "@mantine/core";
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
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(nodeData);

useEffect(() => {
  setEditValue(nodeData);
}, [nodeData]);

  const handleSave = () => {
    try {
      const jsonInst = JSON.parse(editValue);
      useGraph.getState().updateNode(path, jsonInst);
      setIsEditing(false);
    } catch (e) {
      alert("Invalid JSON format. Please correct it before saving.");
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
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="xs">
                Edit
              </Button>
            ) : (
              <Group gap="xs">
                <Button onClick={handleSave} size="xs" color="green">
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} size="xs" color="red" variant="outline">
                  Cancel
                </Button>
              </Group>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {!isEditing ? (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            ) : (
              <textarea
                style={{ width: "100%", minHeight: 150, fontFamily: "monospace" }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
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