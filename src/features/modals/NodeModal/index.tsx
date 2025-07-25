import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group } from "@mantine/core";
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
  const originalNodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const originalPath = useGraph(state => state.selectedNode?.path || "");

  const [nodeData, setNodeData] = useState(originalNodeData);
  const [path, setPath] = useState(originalPath);

  const handleButtonClick = () => {
    // Update the nodeData and path with the latest values from useGraph
    const updatedNodeData = useGraph(state => dataToString(state.selectedNode?.text));
    const updatedPath = useGraph(state => state.selectedNode?.path || "");

    setNodeData(updatedNodeData);
    setPath(updatedPath);
  };

  return (
    <Modal
      title={
        <Group position="apart" style={{ width: "100%" }}>
          <Text>Node Content</Text>
          <Button size="xs" onClick={handleButtonClick}>
            Update Content
          </Button>
        </Group>
      }
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
    >
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
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};