import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) => {
  // If it's an array of entries, convert to object; otherwise, use as is
  const safeObj = Array.isArray(data) && data.every(
    entry => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === "string"
  )
    ? Object.fromEntries(data)
    : data;
  return JSON.stringify(safeObj, null, 2);
};


export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = dataToString(selectedNode?.text);
  const path = useGraph(state => state.selectedNode?.path || "");
  const updateSelectedNodeText = useGraph(state => state.updateSelectedNodeText);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // Reset edit state when modal opens/closes or node changes
  React.useEffect(() => {
    setIsEditing(false);
    setEditValue(nodeData);
  }, [opened, nodeData]);

  const handleSave = () => {
  try {
    let parsed = JSON.parse(editValue);
    // If parsed is an array of entries, convert to object
    if (
      Array.isArray(parsed) &&
      parsed.every(
        entry => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === "string"
      )
    ) {
      parsed = Object.fromEntries(parsed);
    }
    updateSelectedNodeText(parsed);
    setIsEditing(false);
  } catch (e) {
    alert("Invalid JSON");
  }
};

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                minRows={8}
                autosize
                miw={350}
                maw={600}
                styles={{ input: { fontFamily: "monospace" } }}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          <Group mt="xs">
            {isEditing ? (
              <>
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="default" onClick={() => { setIsEditing(false); setEditValue(nodeData); }}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="xs" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </Group>
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