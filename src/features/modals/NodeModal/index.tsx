import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { Button, Textarea, Group } from "@mantine/core";
import useFile from "../../../store/useFile";

// Utility to update JSON at a given path
function updateJsonAtPath(jsonString: string, path: string, newValue: any): string {
  const obj = JSON.parse(jsonString);
  const keys = path.split(".");
  let ref = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    ref = ref[keys[i]];
  }
  try {
    ref[keys[keys.length - 1]] = JSON.parse(newValue);
  } catch {
    ref[keys[keys.length - 1]] = newValue;
  }
  return JSON.stringify(obj, null, 2);
}

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const node = useGraph(state => state.selectedNode);
  const nodeData = dataToString(node?.text);
  const path = node?.path || "";

  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(nodeData);

  const contents = useFile(state => state.contents);
  const setContents = useFile(state => state.setContents);

  React.useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData]);

  const handleSave = () => {
    try {
      const updatedJson = updateJsonAtPath(contents, path, editValue);
      setContents({ contents: updatedJson });
      setIsEditing(false);
      onClose();
    } catch (e) {
      // Optionally handle error
    }
  };

  const handleCancel = () => {
    setEditValue(nodeData);
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                autosize
                minRows={3}
                maxRows={10}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          ) : (
            <Group>
              <Button onClick={handleSave} color="green">Save</Button>
              <Button onClick={handleCancel} color="gray">Cancel</Button>
            </Group>
          )}
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

