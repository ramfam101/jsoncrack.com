import React, { useState } from "react";
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
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const path = selectedNode?.path || "";

  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(() => dataToString(selectedNode?.text));

  const handleSave = () => {
    try {
      const parsed = JSON.parse(tempValue);
      if (setSelectedNode && selectedNode) {
        setSelectedNode({
          ...selectedNode,
          text: parsed,
        });
      }
      setIsEditing(false);
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  const handleCancel = () => {
    setTempValue(dataToString(selectedNode?.text));
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>
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
                <Button size="xs" variant="default" onClick={handleCancel}>Cancel</Button>
              </Group>
            </>
          ) : (
            <>
              <ScrollArea.Autosize mah={250} maw={600}>
                <CodeHighlight code={tempValue || ""} miw={350} maw={600} language="json" withCopyButton />
              </ScrollArea.Autosize>
              <Button size="xs" mt="xs" onClick={() => setIsEditing(true)}>Edit</Button>
            </>
          )}
        </Stack>
        <Text fz="xs" fw={500}>JSON Path</Text>
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

