import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

function setByPath(obj: any, pathArr: string[], value: any) {
  let curr = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    if (!(pathArr[i] in curr)) curr[pathArr[i]] = {};
    curr = curr[pathArr[i]];
  }
  curr[pathArr[pathArr.length - 1]] = value;
}

const dataToString = (data: any) => {
  if (data === undefined || data === null) return '';
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const node = useGraph(state => state.selectedNode);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const [editValue, setEditValue] = useState(nodeData);

  useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData, opened]);

  const setContents = useFile(state => state.setContents);
  const setGraph = useGraph(state => state.setGraph);

  const handleSave = () => {
    try {
      const parsedNode = JSON.parse(editValue);
      const fileContents = useFile.getState().getContents();
      const json = JSON.parse(fileContents);
      const nodePath = path.split(".").filter(Boolean);

      if (!path || path === "{Root}") {
        setContents({ contents: JSON.stringify(parsedNode, null, 2) });
      } else {
        const cleanPath = nodePath[0] === "{Root}" ? nodePath.slice(1) : nodePath;
        setByPath(json, cleanPath, parsedNode);
        setContents({ contents: JSON.stringify(json, null, 2) });
      }

      setIsEditing(false);
      setGraph();
    } catch (e) {
      alert("Invalid JSON");
    }
  }

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={() => { setIsEditing(false); onClose(); }} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
          {isEditing && (
            <>
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={() => {setIsEditing(false), setEditValue(nodeData)}}>Discard</Button>
            </>
          )}
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <textarea
                style={{ width: '100%', minHeight: 200, fontFamily: 'monospace' }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
            ) : (
              <CodeHighlight code={editValue} miw={350} maw={600} language="json" withCopyButton />
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
