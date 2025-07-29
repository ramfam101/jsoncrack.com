import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile"; // Add this import

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

// Utility to parse paths like "members[0].name" or "{Root}.members[0].name"
function parsePath(path: string) {
  // Remove {Root} or Root. prefix
  path = path.replace(/^\{?Root\}?\.?/, "");
  const parts: (string | number)[] = [];
  path.split(".").forEach(segment => {
    // Handle array indices
    const arrayMatch = segment.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      parts.push(arrayMatch[1]);
      parts.push(Number(arrayMatch[2]));
    } else if (segment.length) {
      parts.push(segment);
    }
  });
  return parts;
}

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = dataToString(selectedNode?.text);
  const path = selectedNode?.path || "";

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // Reset editValue when nodeData changes or when entering edit mode
  React.useEffect(() => {
    if (editing) setEditValue(nodeData);
  }, [nodeData, editing]);

  // Utility: get parent object and key
  function getParentAndKey(json, pathArr) {
    let parent = json;
    for (let i = 0; i < pathArr.length - 1; i++) {
      parent = parent[pathArr[i]];
    }
    return { parent, key: pathArr[pathArr.length - 1] };
  }

  const handleSave = () => {
    try {
      const jsonStr = useFile.getState().getContents();
      const json = JSON.parse(jsonStr);

      const pathArr = parsePath(path);
      const { parent, key } = getParentAndKey(json, pathArr);
      const currentValue = parent[key];

      if (editing && selectedNode?.isKeyNode) {
        if (editValue !== key) {
          parent[editValue] = currentValue;
          delete parent[key];
        }
      } else {
        let newValue;
        try {
          newValue = JSON.parse(editValue);
        } catch {
          newValue = editValue;
        }

        const isCurrentArray = Array.isArray(currentValue);
        const isNewArray = Array.isArray(newValue);
        const isCurrentObject = typeof currentValue === "object" && currentValue !== null && !isCurrentArray;
        const isNewObject = typeof newValue === "object" && newValue !== null && !isNewArray;
        const isCurrentPrimitive = !isCurrentArray && !isCurrentObject;
        const isNewPrimitive = !isNewArray && !isNewObject;

        if (
          (isCurrentArray && !isNewArray) ||
          (isCurrentObject && !isNewObject) ||
          (isCurrentPrimitive && !isNewPrimitive)
        ) {
          alert("Type mismatch: You must keep the same type (object, array, or primitive) as the original value.");
          return;
        }

        parent[key] = newValue;
      }

      // Update the global JSON
      useFile.getState().setContents({ contents: JSON.stringify(json, null, 2) });

      // Update local modal state to reflect changes immediately
      const updatedNodeData = dataToString(parent[key]);
      setEditValue(updatedNodeData);

      setEditing(false);

      // Close the modal after saving
      onClose();
    } catch (e) {
      alert("Invalid value or path");
    }
  };

  const handleCancel = () => {
    setEditValue(nodeData);
    setEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {editing ? (
              <Textarea value={editValue} onChange={e => setEditValue(e.target.value)} />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
        </Stack>
        {!editing && (
          <Button onClick={() => setEditing(true)}>Edit</Button>
        )}
        {editing && (
          <Stack gap="xs" direction="row">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" color="gray" onClick={handleCancel}>
              Cancel
            </Button>
          </Stack>
        )}
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
