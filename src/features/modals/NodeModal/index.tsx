import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";
import { set } from "lodash";

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
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const updateSelectedNodeText = useGraph(state => state.updateSelectedNodeText);
  const updatedContents = useFile(state => state.setContents);
  const nodes = useGraph(state => state.nodes);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  React.useEffect(() => {
    setIsEditing(false);
    setEditValue(nodeData);
  }, [opened, nodeData]);

  const editClick = () => setIsEditing(true);
  const cancelClick = () => {
  setIsEditing(false);
  setEditValue(nodeData);
  }

  const handleSave = () => {
  try {
    const parsed = JSON.parse(editValue);
    const contents = useFile.getState().contents;
    const json = JSON.parse(contents);
    const jsonPath = path.replace(/{Root}\.?/, "").replace(/\./g, ".");
    set(json, jsonPath, parsed);
    updatedContents({ contents: JSON.stringify(json, null, 2), skipUpdate: true });
    let newvalue = parsed;
    if (typeof selectedNode?.text === "string") {
      newvalue = JSON.stringify(parsed);
      } 
        else if (Array.isArray(selectedNode?.text)) {
          newvalue = Object.entries(parsed);
        }
        if (selectedNode?.id) {
        updateSelectedNodeText(selectedNode.id, newvalue);
        setIsEditing(false);
        } 
        else {
        alert("Missing Node ID");
      }
    } catch {
      alert("Invalid JSON");
    }
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
                minRows={8}
                autosize
                miw={350}
                maw={600}
                styles={{ input: { fontFamily: "monospace" } }}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          <Group mt="xs">
            {isEditing ? (
              <>
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="default" onClick={() => { setIsEditing(false); setEditValue(nodeData); }}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="xs" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </Group>
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