import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { MdEdit, MdCheck, MdClose } from "react-icons/md";
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
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = dataToString(selectedNode?.text);
  const path = selectedNode?.path || "";
  const updateNodeValue = useFile(state => state.updateNodeValue);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  // Update edit value when node changes
  useEffect(() => {
    if (selectedNode?.text) {
      const rawValue = Array.isArray(selectedNode.text) 
        ? JSON.stringify(Object.fromEntries(selectedNode.text), null, 2)
        : typeof selectedNode.text === 'string' 
          ? selectedNode.text.replace(/^"|"$/g, '') // Remove quotes from string values
          : JSON.stringify(selectedNode.text, null, 2);
      setEditValue(rawValue);
    }
  }, [selectedNode]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (path && editValue !== nodeData) {
      updateNodeValue(path, editValue);
    }
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    if (selectedNode?.text) {
      const rawValue = Array.isArray(selectedNode.text) 
        ? JSON.stringify(Object.fromEntries(selectedNode.text), null, 2)
        : typeof selectedNode.text === 'string' 
          ? selectedNode.text.replace(/^"|"$/g, '')
          : JSON.stringify(selectedNode.text, null, 2);
      setEditValue(rawValue);
    }
    setIsEditing(false);
  };

  const isLeafNode = selectedNode && !selectedNode.data?.isParent;

  return (
    <Modal 
      title={
        <Group gap="sm">
          <Text>Node Content</Text>
          {isLeafNode && !isEditing && (
            <Button 
              size="xs" 
              leftSection={<MdEdit size={14} />}
              color="green"
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
        </Group>
      } 
      size="auto" 
      opened={opened} 
      onClose={onClose} 
      centered
    >
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing ? (
            <Stack gap="sm">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.currentTarget.value)}
                minRows={3}
                maxRows={10}
                autosize
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }
                }}
              />
              <Group gap="sm">
                <Button 
                  size="sm" 
                  leftSection={<MdCheck size={16} />}
                  color="green"
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  leftSection={<MdClose size={16} />}
                  color="red"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          )}
        </Stack>
        <Stack gap="xs">
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
      </Stack>
    </Modal>
  );
};
