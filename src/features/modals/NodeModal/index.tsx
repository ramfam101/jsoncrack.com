import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Button,
  Textarea,
  Group,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const formatDataAsString = (data: any) => {
  const cleanData = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, value: any) =>
    typeof value === "string" ? value.replaceAll('"', "") : value;

  return JSON.stringify(cleanData, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    setTempValue(formatDataAsString(selectedNode?.text));
  }, [selectedNode]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(tempValue);

      if (selectedNode && setSelectedNode) {
        setSelectedNode({
          ...selectedNode,
          text: parsed,
        });
      }

      setIsEditing(false);
    } catch (err) {
      alert("Invalid JSON. Please check your syntax.");
    }
  };

  const resetEdit = () => {
    setTempValue(formatDataAsString(selectedNode?.text));
    setIsEditing(false);
  };

  if (!selectedNode) return null;

  return (
    <Modal
      title="Node Content"
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
    >
      <Stack py="sm" spacing="sm">
        {/* Node Content */}
        <Stack spacing="xs">
          <Text size="xs" weight={500}>Content</Text>
          {isEditing ? (
            <>
              <Textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.currentTarget.value)}
                minRows={6}
                autosize
                styles={{ input: { fontFamily: "monospace" } }}
              />
              <Group mt="xs">
                <Button size="xs" color="green" onClick={handleSave}>Save</Button>
                <Button size="xs" variant="default" onClick={resetEdit}>Cancel</Button>
              </Group>
            </>
          ) : (
            <>
              <ScrollArea.Autosize mah={250} maw={600}>
                <CodeHighlight
                  code={tempValue || ""}
                  miw={350}
                  maw={600}
                  language="json"
                  withCopyButton
                />
              </ScrollArea.Autosize>
              <Button size="xs" mt="xs" onClick={() => setIsEditing(true)}>Edit</Button>
            </>
          )}
        </Stack>

        {/* JSON Path */}
        <Text size="xs" weight={500}>JSON Path</Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={selectedNode.path || ""}
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
