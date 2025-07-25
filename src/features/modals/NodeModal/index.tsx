import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import{Button, Textarea} from "@mantine/core";
import { useState } from "react";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import { setContents } from "../../../store/useJson";
function updateJsonAtPath(json: any, path: string, value: any) {
  const keys = path.split(".");
  let obj = json;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
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
  const selectedNode = useGraph(state => state.selectedNode);
  const updateNodeText = useGraph(state => state.updateNodeText);

  // Always show as formatted JSON
  const nodeData = JSON.stringify(selectedNode?.text ?? "", null, 2);
  const path = selectedNode?.path || "";

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(""); // Start with empty string
  const [error, setError] = useState("");
  const handleEditClick = () => {
    setEditValue(nodeData); // Set the value only when editing starts
    setIsEditing(true);
  };

const handleSaveClick = () => {
  if (selectedNode && selectedNode.id) {
    try {
      const formattedValue = JSON.parse(editValue);

      // Update node in graph
      updateNodeText(selectedNode.id, formattedValue);

      // Update main JSON using the node's path
      const mainJson = useJson.getState().json;
      const updatedJson = updateJsonAtPath(mainJson, selectedNode.path, formattedValue);
      setContents({
        contents: JSON.stringify(updatedJson, null, 2),
        format: "json",
        hasChanges: true,
      });

      setIsEditing(false);
    } catch {
      setError("Invalid JSON format. Please check your input.");
    }
  }
};

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack gap="xs">
  <Text fz="xs" fw={500}>
    Content
  </Text>
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
      <Button onClick={handleEditClick} size="xs" mt="xs">
        Edit
      </Button>
    </>
  )}
</Stack>
    </Modal>
  );
};
