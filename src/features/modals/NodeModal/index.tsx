import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, Textarea, ScrollArea, Group, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

// given json object, a node value to change and the path there, update
const updateJson = (obj: any, pathStr: string, value: any) => {
  const keys = pathStr.startsWith("{Root}.")
    ? pathStr.slice("{Root}.".length).split(".")
    : pathStr.split("."); //clean path so we can parse
  let current = obj;  // use the active json as the object to update

  for (let i = 0; i < keys.length - 1; i++) { 
    const key = keys[i];
    if (current[key] === undefined || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  const updateKey = keys[keys.length - 1];
  current[updateKey] = value; // update node's value
  return obj;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeObj = useGraph(state => state.selectedNode);
  const updateNode = useGraph(state => state.updateSelectedNode);
  const nodeData = dataToString(nodeObj?.text);
  const path = useGraph(state => state.selectedNode?.path || "");
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(nodeData)
  

  const jsonData = useFile(state => state.contents);
  const jsonObj = JSON.parse(jsonData); 
  const setContents = useFile(state => state.setContents);
  

  const handleEdit = () => {
    setEditValue(nodeData); // set edit value to current node data 
    setIsEditing(true);
  }
  const handleCancel = () => {
    setEditValue(nodeData); 
    setIsEditing(false);
  }

  const handleSave = () => {
    try {
      const parsedEdit = JSON.parse(editValue); 
      updateNode?.(nodeObj.id, parsedEdit);

      const updatedJson = updateJson(jsonObj,path,parsedEdit);   
      setContents({
        contents: JSON.stringify(updatedJson, null, 2),
      });
      setIsEditing(false);

    } catch {
      alert("Invalid JSON");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group mt="xs" mb="md" justify="space-between"> 
            <Text fz="xs" fw={500}> Content </Text>
            {!isEditing && ( // show edit button when not editing
              <Button onClick={handleEdit}> Edit </Button>
            )}
            {isEditing && ( // show save and cancel buttons when editing
              <Group justify="right">
                <Button color = "green" onClick={handleSave}>Save</Button>
                <Button variant="outline" color = "red" onClick={handleCancel}>Cancel</Button>
              </Group>
            )}
          </Group>  
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (  // change to editable textarea when editing
              <Textarea
                autosize
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
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