import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  return JSON.stringify(text, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");
  const setContents = useFile(state => state.setContents);
  const contents = useFile(state => state.contents);

  React.useEffect(() => {
    setEditValue(nodeData || "");
  }, [nodeData]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedNode) return;
    try {
      const json = JSON.parse(contents);
      const newValue = JSON.parse(editValue);
      const match = selectedNode.path?.match(/\{Root\}\.(\w+)/);
      
      if (match?.[1]) {
        const key = match[1];
        const isRenaming = typeof newValue === 'string' && typeof json[key] === 'object';
        const newJson = {};
        
        for (const [k, v] of Object.entries(json)) {
          if (k === key) {
            newJson[isRenaming ? newValue : k] = isRenaming ? v : newValue;
          } else {
            newJson[k] = v;
          }
        }
        setContents({ contents: JSON.stringify(newJson, null, 2) });
      } else {
        setContents({ contents: editValue });
      }
      setIsEditing(false);
    } catch (e) {
      alert('Invalid JSON format. Please fix and try again.');
    }
  };

  const handleCancel = () => {
    setEditValue(nodeData || "");
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        {isEditing ? (
          <Stack gap="sm">
            <Button size="xs" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              minRows={5}
              maxRows={10}
              style={{ width: '100%', minWidth: '350px' }}
            />
            <Button size="xs" onClick={handleSave}>Save</Button>
          </Stack>
        ) : (
          <Stack gap="xs">
            <Button size="xs" onClick={handleEdit}>Edit</Button>
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={editValue || ""} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          </Stack>
        )}
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={path || ""}
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