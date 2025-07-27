import React, {useState} from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group} from "@mantine/core";
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
  const updateSelectedNodeText = useGraph(state => state.updateSelectedNodeText);

  const saveclick = () => {
    try {
      JSON.parse(editedData);
      updateSelectedNodeText(editedData);
      setIsEditing(false);
    } catch (e) {
      alert("Invalid JSON format.");
    }
  };

  const path = useGraph(state => state.selectedNode?.path || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState("");

  const nodeData = selectedNode ? dataToString(selectedNode.text) : "";

  const editclick = () => {
    setIsEditing(true);
    setEditedData(nodeData);
  };

  const cancelclick = () => {
    setIsEditing(false);
    setEditedData("");
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      {!isEditing && (
        <Button fz="l" fw={500} onClick={editclick}>
          Edit
        </Button>
      )}
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editedData}
                onChange={e => setEditedData(e.currentTarget.value)}
                autosize
                minRows={6}
                maxRows={12}
                styles={{ input: { fontFamily: "monospace", minWidth: 350 } }}
              />
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

        {isEditing && (
          <Group gap="sm">
            <Button color="gray" onClick={cancelclick}>Cancel</Button>
            <Button color="blue" onClick={saveclick}>Save</Button>
          </Group>
        )}

        <Text fz="xs" fw={500}>JSON Path</Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={path}
            miw={350}
            mah={250}
            language="json"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};

