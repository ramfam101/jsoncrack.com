import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { Button, Group } from "@mantine/core";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  //const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  //const path = useGraph(state => state.selectedNode?.path || "");
  const nodeDataRaw = useGraph(state => state.selectedNode?.text);
  const nodeData = dataToString(nodeDataRaw);
  const path = useGraph(state => state.selectedNode?.path || "");

  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(nodeData);

  React.useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData, opened]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setEditValue(nodeData);
    setIsEditing(false);
  };
  const handleSave = () => {
    // TODO: Save logic here (e.g., update node data in store)
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {!isEditing ? (
        <Button size="xs" onClick={handleEdit}>Edit</Button>
        ) : (
        <>
          <Button size="xs" color="green" onClick={handleSave}>Save</Button>
          <Button size="xs" color="gray" variant="outline" onClick={handleCancel}>Cancel</Button>
        </>
        )}
          <ScrollArea.Autosize mah={250} maw={600}>
            <Textarea value={editValue} onChange={(e) => setEditValue(e.currentTarget.value)} autosize minRows={5} maxRows={10} readOnly={!isEditing} />
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
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
