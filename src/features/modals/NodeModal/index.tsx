import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
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
  const node = useGraph(state => state.selectedNode);
  const nodeData = dataToString(node?.text);
  const path = node?.path || "";

  // Add local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // Update editValue when node changes
  React.useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
  }, [nodeData]);

  // Save handler (replace with your update logic)
  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);

      const contents = useFile.getState().getContents();
      const json = JSON.parse(contents);

      function setValueAtPath(obj: any, path: string, value: any) {
        const keys = path.replace("{Root}.", "").split(".");
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      }

      setValueAtPath(json, path, parsed);

      useFile.getState().setContents({ contents: JSON.stringify(json, null, 2) });

      if (node) {
        node.text = parsed; // Update the selected node's text property
      }

      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fz="xs" fw={500}>Content</Text>
            {isEditing ? (
              <Group>
                <Button size="xs" color="green" onClick={handleSave}>Save</Button>
                <Button size="xs" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </Group>
            ) : (
              <Button size="xs" variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Stack>
                <Textarea
                  value={editValue}
                  onChange={e => setEditValue(e.currentTarget.value)}
                  autosize
                  minRows={6}
                  maxRows={12}
                  maw={600}
                  miw={350}
                  styles={{ input: { fontFamily: "monospace" } }}
                />
              </Stack>
            ) : (
              <CodeHighlight
                code={nodeData}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
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
