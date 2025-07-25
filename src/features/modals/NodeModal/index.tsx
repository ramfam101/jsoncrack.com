import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { Button, Textarea, Group } from '@mantine/core';
import { useState } from 'react';

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
    


  // Add state for the edit modal
  const [editOpened, setEditOpened] = useState(false);
  const [editableContent, setEditableContent] = useState("");

    const HandleEdit = () => {
        setEditableContent(nodeData);
        setEditOpened(true);
    };


    const onEditClose = () => setEditOpened(false);


    const handleSave = () => {
        const selectedNode = useGraph(state => state.selectedNode);
        const updateNodeContent = useGraph(state => state.updateNodeContent);
  
        if (selectedNode) {
            updateNodeContent(selectedNode.id, editableContent);
        }

        console.log("SaveThisShit", editableContent);
        onEditClose();
    };

  return (
      <>
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
        <Button onClick={HandleEdit} variant="filled">
            edit    
        </Button>
        </ScrollArea.Autosize>
      </Stack>
    </Modal>


    <Modal title="Edit Node Content" size="auto" opened={editOpened} onClose={onEditClose} centered>
        <Stack py="sm" gap="sm">
          <Stack gap="xs">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <ScrollArea.Autosize mah={250} maw={600}>
              <Textarea
                value={editableContent}
                onChange={(event) => setEditableContent(event.currentTarget.value)}
                minRows={10}
                maxRows={15}
                autosize
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }
                }}
              />
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
          <Group justify="flex-end" gap="sm">
            <Button onClick={onEditClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} variant="filled">
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
      </>
  );
};
