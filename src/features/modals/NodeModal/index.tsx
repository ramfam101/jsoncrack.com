import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, Button, ScrollArea, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";


const dataToString = (data: any) => {
  // If it's already a string, return as is (preserves formatting)
  if (typeof data === "string") return data;
  // Otherwise, pretty-print it
  return JSON.stringify(data, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const selectedNodeId = useGraph(state => state.selectedNode?.id);
  const updateNodeText = useGraph(state => state.updateNodeText); 
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedData, setEditedData] = React.useState(nodeData);
  const setContents = useFile(state => state.setContents);

  React.useEffect(() => {
    if (!isEditing) {
      setEditedData(nodeData);
    }
  }, [nodeData, isEditing]);

  const handleEdit = () => {
    setEditedData(nodeData);
    setIsEditing(true);
  };

  const handleSave = () => {
    try {
      JSON.parse(editedData);
      if(selectedNodeId) {
        updateNodeText(selectedNodeId, editedData);
        // setContents({ contents: JSON.stringify(parsed, null, 2) })
      }
      setIsEditing(false);
    } catch (e) {
      console.error("Invalid JSON format");
    }
  }

  const handleCancel = () => {
    setEditedData(nodeData);
    setIsEditing(false);
  }

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!isEditing ? (
              <Button size="xs" variant="light" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <Group>
                <Button size="xs" variant="filled" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="default" onClick={handleCancel}>
                  Cancel
                </Button>
              </Group>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editedData}
                onChange={e => setEditedData(e.currentTarget.value)}
                minRows={8}
                maxRows={15}
                autosize
                spellCheck={false}
                styles={{ input: { fontFamily: "monospace", fontSize: 13 } }}
                miw={350}
                maw={600}
              />
            ) : (
              <CodeHighlight code={nodeData ?? ""} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={path ?? ""}
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
