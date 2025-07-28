import React, {useState} from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Textarea, Button, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile"

const setValueAtPath = (obj: any, path: string, value: any) => {
  if (!path) return value;

  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1;i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
    current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
  }

  const lastkey = keys[keys.length -1];
  current[lastkey] = value;
  return obj;
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
  const [jsonText, setJsonText] = useState(() => dataToString(selectedNode?.text));
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const [editValue, setEditValue] = useState(nodeData);
  const path = useGraph(state => state.selectedNode?.path || "");
  const setSelectedNode = useGraph(state => state.setSelectedNode);


  React.useEffect(() => {
    setJsonText(dataToString(selectedNode?.text));
    setError(null);
    setIsEditing(false);
  }, [selectedNode]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    setError(null);
  };

  const handleSave = () => {
  try {
    const parsed = JSON.parse(jsonText);
    const rJson = useFile.getState().contents;
    const rObj = JSON.parse(rJson);

    const updatedPath = path.replace(/^\{Root\}\./, "");
    const updatedJson = setValueAtPath(rObj, updatedPath, parsed);

    useFile.getState().setContents({ contents: JSON.stringify(updatedJson, null, 2) });

    setSelectedNode({
      ...selectedNode,
      id: selectedNode?.id ?? "",
      text: parsed,
      width: selectedNode?.width ?? 0,
      height: selectedNode?.height ?? 0,
      path: selectedNode?.path,
      data: selectedNode?.data ?? {
        type: "object",
        isParent: false,
        isEmpty: false,
        childrenCount: 0
      }
    });

    setError(null);
    setIsEditing(false);
  } catch (err) {
    setError("Invalid JSON format");
  }
};

const handleCancel = () => {
  const currentData = dataToString(selectedNode?.text);
  setJsonText(currentData);
  setIsEditing(false);
};


  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>
          {isEditing ? (
            <Group gap={5}>
              <Button color="green" onClick={() => {handleSave(); setIsEditing(false);}}>Save</Button>            
              <Button color="gray" onClick={() => {setEditValue(dataToString(selectedNode?.text));setIsEditing(false)}}>Cancel</Button>
            </Group>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
          <Textarea
            value={jsonText}
            onChange={handleChange}
            minRows={6}
            autosize
            error={error}
            maw={600}
            miw={350}
            spellCheck={false}
          />
          {error && <Text color="red" fz="xs">{error}</Text>}
          <ScrollArea.Autosize mah={250} maw={600}>
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
