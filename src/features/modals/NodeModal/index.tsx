import React, { useEffect, useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Textarea, Button, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { useFile } from "../../../store/useFile";
import useJson from "../../../store/useJson";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const convertDataToString = (input: any) =>
  JSON.stringify(
    Array.isArray(input) ? Object.fromEntries(input) : input,
    (_k, v) => (typeof v === "string" ? v.replaceAll('"', "") : v),
    2
  );

export const UniqueNodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeContent = useGraph(store => convertDataToString(store.selectedNode?.text));
  const nodePath = useGraph(store => store.selectedNode?.path || "");

  const { json, setJson } = useJson();
  const updateFileContent = useFile((state) => state.updateFileContent);
  const { setGraph, setSelectedNode, selectedNode } = useGraph.getState();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editText, setEditText] = useState(nodeContent);

  useEffect(() => {
    setEditText(nodeContent);
  }, [nodeContent]);

  const saveNodeContent = () => {
    const parsedValue = JSON.parse(editText);
    const cleanedPath = nodePath.replace("{Root}.", "");
    const pathParts = cleanedPath.split(".");

    const originalJson = typeof json === "string" ? JSON.parse(json) : json;
    const updatedJson = JSON.parse(JSON.stringify(originalJson));
    let current: any = updatedJson;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const key = pathParts[i];
      if (typeof current[key] !== "object" || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[pathParts.at(-1)!] = parsedValue;

    const updatedJsonString = JSON.stringify(updatedJson, null, 2);

    setJson(updatedJson);
    updateFileContent({ contents: updatedJsonString });
    setGraph(updatedJsonString);

    if (selectedNode) {
      setSelectedNode({
        ...selectedNode,
        text: parsedValue,
        data: selectedNode.data,
      });
    }

    setIsEditMode(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!isEditMode ? (
              <Button size="xs" variant="light" onClick={() => setIsEditMode(true)}>
                Edit
              </Button>
            ) : (
              <Group gap="xs">
                <Button size="xs" onClick={saveNodeContent}>
                  Save
                </Button>
                <Button size="xs" variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
              </Group>
            )}
          </Group>

          {!isEditMode ? (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeContent} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          ) : (
            <Textarea
              value={editText}
              onChange={e => setEditText(e.currentTarget.value)}
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
          <CodeHighlight code={nodePath} miw={350} mah={250} language="json" withCopyButton />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};