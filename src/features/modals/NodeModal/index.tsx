import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Textarea, Group, Button } from "@mantine/core";
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

export const NodeModal = ({ opened, onClose }: ModalProps) => { // had to look up how to (re)write the the following lines. (Used the google ai)
  const spNode = useGraph((state) => state.selectedNode);
  const ogData = dataToString(spNode?.text);
  const path = spNode?.path || "";

  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState(ogData); // Auto completed.

  const Edit = () => {
    setIsEditing(true);
    setEditableData(ogData);
  };

  const Cancel = () => { // Auto completed.
    setIsEditing(false);
    setEditableData(ogData);
  };

  const Save = () => { // Mostly auto completed.
    try {
      const parsed = JSON.parse(editableData);
      useGraph.setState((prev) => ({
        selectedNode: {
          ...prev.selectedNode!,
          text: parsed,
        },
      }));
      setIsEditing(false);
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>

          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editableData}
                onChange={(e) => setEditableData(e.currentTarget.value)}
                autosize
                minRows={6}
                maxRows={12}
                miw={350}
                maw={600}
                styles={{ input: { fontFamily: "monospace", whiteSpace: "pre" } }}
              />
            ) : (
              <CodeHighlight
                code={ogData}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>

          <Group mt="xs">
            {isEditing ? (
              <>
                <Button size="xs" onClick={Save} color="green">
                  Save
                </Button>
                <Button size="xs" onClick={Cancel} color="red" variant="light"> // Auto completed.
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="xs" onClick={Edit} color="green"> // Mostly auto completed.
                Edit
              </Button>
            )}
          </Group>
        </Stack>

        <Text fz="xs" fw={500}>JSON Path</Text>
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

