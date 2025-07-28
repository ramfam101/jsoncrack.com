import React from "react";
import { useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import{Button, Textarea,Group} from "@mantine/core";
import { useState } from "react";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";
import { on } from "events";

function updateJsonAtPath(json: any, path: string, value: any) {
  const cleanedPath = path.replace("{Root}.", "");
  const keys = cleanedPath.split(".");
  let obj = json;

  if (keys.length === 1 && keys[0] === "") {
    // Handle root path (e.g., {Root})
    Object.assign(json, value);
    return json;
  }

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const match = key.match(/(\w+)\[(\d+)\]/);
    if (match) {
      const arrayName = match[1];
      const index = parseInt(match[2], 10);
      obj = obj[arrayName][index];
    } else {
      obj = obj[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  const lastMatch = lastKey.match(/(\w+)\[(\d+)\]/);
  if (lastMatch) {
    const arrayName = lastMatch[1];
    const index = parseInt(lastMatch[2], 10);
    obj[arrayName][index] = value;
  } else {
    obj[lastKey] = value;
  }

  return json;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);


  useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
  }, [nodeData]);
const handleSaveClick = () => {


    const parsed = JSON.parse(editValue); // Validate and parse editValue
    const contents = useFile.getState().getContents();
    const json = JSON.parse(contents);

    // Update JSON at the specified path
    updateJsonAtPath(json, path, parsed);

    // Update file contents
    useFile.getState().setContents({ contents: JSON.stringify(json, null, 2) });

    // Update node text
    node.text = parsed;

    setIsEditing(false);
};

return (
  <Modal
    title="Node Content"
    size="auto"
    opened={opened}
    onClose={onClose}
    centered
    withCloseButton={false} // hide the default X button
  >
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text fz="xs" fw={500}>
          Content
        </Text>
                  <Button
            variant="subtle"
            size="xs"
            color="gray"
            onClick={() => {setIsEditing(false);onClose();}}
          >
            Cancel
          </Button>
      </Group>

      {isEditing ? (
        <>
          <Textarea
            value={editValue}
            onChange={e => setEditValue(e.currentTarget.value)}
            minRows={4}
            autosize
            maw={600}
          />
          <Button onClick={handleSaveClick} size="xs" mt="xs">
            Save
          </Button>
        </>
      ) : (
        <>
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
          </ScrollArea.Autosize>
          <Button size="xs" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </>
      )}
    </Stack>
  </Modal>
);}
