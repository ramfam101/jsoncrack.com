import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { Button } from "@mantine/core";
import { useState } from "react";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const updateSelectedNodeText = useGraph(state => state.updateSelectedNodeText);
  
  const nodeData = selectedNode ? dataToString(selectedNode.text) : "";
  const path = selectedNode?.path || "";

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);
  
  React.useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData]);

  const handleSave = () => {
    try {
      updateSelectedNodeText(editValue);
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Error saving node data:", error);
      alert("Error saving changes. Please check that your JSON is valid.");
    }
  };

  const handleCancel = () => {
    setEditValue(nodeData);
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="right">
            <Text fz="xs" fw={500}>Content</Text>
            {!isEditing && (
              <Button size="xs" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <>
                <textarea
                  style={{ width: "100%", minHeight: "150px" }}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                />
                <Group mt="xs">
                  <Button size="xs" variant="light" onClick={handleSave}>
                    Save
                  </Button>
                  <Button size="xs" variant="light" color="red" onClick={handleCancel}>
                    Cancel
                  </Button>
                </Group>
              </>
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