import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
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
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const [editContentModalOpened, setEditContentModalOpened] = useState(false);

  return (
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
        <Button onClick={() => setEditContentModalOpened(true)}>Edit Content</Button>
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
      <EditContentModal opened={editContentModalOpened} onClose={() => { setEditContentModalOpened(false); onClose() }} />
    </Modal>
  );
};

const EditContentModal = ({ opened, onClose }: ModalProps) => {
  const [nodeData, setNodeData] = useState(useGraph(state => dataToString(state.selectedNode?.text)));
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodeData(event.target.value);
  };

  const handleSave = () => {
    console.log(nodeData);
    onClose();
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Textarea value={nodeData} autosize contentEditable={true} onChange={handleChange} />
      </Stack>
      <Button onClick={handleSave}>Save</Button>
    </Modal>
  );
};
