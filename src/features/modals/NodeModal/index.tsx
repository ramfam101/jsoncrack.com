import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, TextInput } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const path = selectedNode?.path || "";
  const [isEditing, setIsEditing] = useState(false);
  const [attributes, setAttributes] = useState<{ [key: string]: string }>({});

  const isParentNode = selectedNode?.data?.isParent;

  // Parse node text to object when modal opens or node changes
  useEffect(() => {
    if (opened && selectedNode) {
      console.log("selectedNode:", selectedNode);
      let obj: any = {};
      if (Array.isArray(selectedNode.text)) {
        obj = Object.fromEntries(selectedNode.text);
      } else if (typeof selectedNode.text === "string") {
        try {
          obj = JSON.parse(selectedNode.text);
        } catch {
          obj = { value: selectedNode.text };
        }
      } else if (typeof selectedNode.text === "object" && selectedNode.text !== null) {
        obj = selectedNode.text;
      }
      setAttributes(obj);
      setIsEditing(false);
    }
  }, [opened, selectedNode]);

  const handleAttrChange = (key: string, value: string) => {
    setAttributes(attrs => ({ ...attrs, [key]: value }));
  };

  const handleSave = () => {
  if (isParentNode) {
    // Don't allow editing parent node's text!
    setIsEditing(false);
    return;
  }
  useGraph.getState().updateNode(path, Object.entries(attributes));
  setIsEditing(false);
};

  if (!selectedNode) return null;

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Stack>
                {Object.entries(attributes).map(([key, value]) => (
                  <TextInput
                    key={key}
                    label={key}
                    value={value}
                    onChange={e => handleAttrChange(key, e.currentTarget.value)}
                  />
                ))}
              </Stack>
            ) : (
              <CodeHighlight
                code={JSON.stringify(attributes, null, 2)}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
          <Group mt="xs">
            {isEditing ? (
              <>
                <Button color="green" onClick={handleSave}>Save</Button>
                <Button color="red" onClick={() => setIsEditing(false)}>Cancel</Button>
              </>
            ) : (
              !isParentNode && <Button onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </Group>
        </Stack>
        <Text fz="xs" fw={500}>JSON Path</Text>
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