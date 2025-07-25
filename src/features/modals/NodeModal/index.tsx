import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core"; 
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

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

  const [isEditing, setIsEditing] = useState(false); 
  const [editValue, setEditValue] = useState(nodeData); 

  useEffect(() => { 
    setIsEditing(false); 
    setEditValue(nodeData); 
  }, [opened, nodeData]); 

  const updateNode = useGraph(state => state.updateNode); 

  const handleSave = () => { 
    try {
      const parsed = JSON.parse(editValue);
      updateNode(selectedNode?.id, parsed);
      setIsEditing(false);
    } catch {
      alert("Invalid JSON");
    }
  }; 

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center"> {/*  */}
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!isEditing && ( 
              <Button size="xs" onClick={() => setIsEditing(true)} variant="light"> 
                Edit 
              </Button> 
            )} 
            {isEditing && ( 
              <Group gap="xs"> 
                <Button size="xs" color="green" onClick={handleSave}>Save</Button> 
                <Button size="xs" color="gray" onClick={() => setIsEditing(false)}>Cancel</Button> 
              </Group> 
            )} 
          </Group> {/*  */}
          <ScrollArea.Autosize mah={250} maw={600}>
            {!isEditing ? ( 
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            ) : ( 
              <Textarea 
                autosize 
                minRows={6} 
                maxRows={12} 
                value={editValue} 
                onChange={e => setEditValue(e.currentTarget.value)} 
                maw={600} 
                miw={350} 
                styles={{ input: { fontFamily: "monospace" } }} 
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