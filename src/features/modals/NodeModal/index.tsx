import React, { useEffect, useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Textarea, Button, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useFile from "../../../store/useFile";
import useJson from "../../../store/useJson";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) =>
  JSON.stringify(
    Array.isArray(data) ? Object.fromEntries(data) : data,
    (_k, v) => (typeof v === "string" ? v.replaceAll('"', "") : v),
    2
  );

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");

  const { json, setJson } = useJson();
  const { setContents } = useFile.getState();
  const { setGraph, setSelectedNode, selectedNode } = useGraph.getState();

  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData]);

  const handleSave = () => {
    const parsed = JSON.parse(editValue);
    const cleanPath = path.replace("{Root}.", "");
    const parts = cleanPath.split(".");

    const original = typeof json === "string" ? JSON.parse(json) : json;
    const updated = JSON.parse(JSON.stringify(original));
    let curr: any = updated;

    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (typeof curr[key] !== "object" || curr[key] === null) {
        curr[key] = {};
      }
      curr = curr[key];
    }

    curr[parts.at(-1)!] = parsed;

    const updatedJsonString = JSON.stringify(updated, null, 2);

    setJson(updated);
    setContents({ contents: updatedJsonString });
    setGraph(updatedJsonString);

    if (selectedNode) {
      setSelectedNode({
        ...selectedNode,
        text: parsed,
        data: selectedNode.data,
      });
    }

    setEditMode(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!editMode ? (
              <Button size="xs" variant="light" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            ) : (
              <Group gap="xs">
                <Button size="xs" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </Group>
            )}
          </Group>

          {!editMode ? (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          ) : (
            <Textarea
              value={editValue}
              onChange={e => setEditValue(e.currentTarget.value)}
              autosize
              minRows={4}
              maxRows={10}
            />
          )}
        </Stack>

        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight code={path} miw={350} mah={250} language="json" withCopyButton />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
