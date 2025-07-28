import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Group, Button, Textarea} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

const arrayPairsToObject = (data: any) => {
  if (Array.isArray(data)) {
    try {
      return Object.fromEntries(data);
    } catch {
      return data;
    }
  }
  return data;
};

const objectToArrayPairs = (obj: any) => {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return Object.entries(obj);
  }
  return obj;
};

const prettyPrintJson = (data: any) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return "";
  }
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph((state) => state.selectedNode);
  const path = selectedNode?.path || "";
  const updateSelectedNodeText = useGraph((state) => state.updateSelectedNodeText);
  const contents = useFile((state) => state.contents);
  const setContents = useFile((state) => state.setContents);

  // Convert array-of-pairs to object for editing
  const initialEditValue = prettyPrintJson(arrayPairsToObject(selectedNode?.text));

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialEditValue);

  // Sync editValue when selectedNode changes or modal reopens
  useEffect(() => {
    setEditValue(prettyPrintJson(arrayPairsToObject(selectedNode?.text)));
  }, [selectedNode, opened]);

  const handleEditClick = () => {
    setEditing(true);
  };

  const handleSave = () => {
  try {
    const parsedNodeData = JSON.parse(editValue);

    if (!selectedNode?.id || !selectedNode?.path) {
      throw new Error("Selected node ID or path is missing");
    }

    // Fix path parsing
    const jsonKey = selectedNode.path.replace(/^\{Root\}\./, "").split(".")[0];

    // Update the graph state
    updateSelectedNodeText(objectToArrayPairs(parsedNodeData));

    // Update the JSON file (left side text editor)
    const { contents, setContents } = useFile.getState();
    const fullJson = JSON.parse(contents);

    console.log("Selected node ID:", selectedNode.id);
    console.log("Matching top-level key:", jsonKey);
    console.log("JSON keys:", Object.keys(fullJson));

    if (!Object.prototype.hasOwnProperty.call(fullJson, jsonKey)) {
      throw new Error("Top-level key not found in JSON: " + jsonKey);
    }

    const updatedJson = {
      ...fullJson,
      [jsonKey]: parsedNodeData,
    };

    setContents({
      contents: JSON.stringify(updatedJson, null, 2),
      skipUpdate: false,
    });

    setEditing(false);
  } catch (err) {
    console.error("Error parsing JSON:", err);
    alert("Invalid JSON. Please fix syntax errors.");
  }
};

  const handleCancel = () => {
    setEditValue(prettyPrintJson(arrayPairsToObject(selectedNode?.text)));
    setEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>Content</Text>
            {!editing ? (
              <Button size="xs" variant="light" onClick={handleEditClick}>
                Edit
              </Button>
            ) : (
              <Group gap="xs">
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="light" color="gray" onClick={handleCancel}>
                  Cancel
                </Button>
              </Group>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {editing ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.currentTarget.value)}
                minRows={10}
                autosize
                styles={{ input: { fontFamily: "monospace" } }}
              />
            ) : (
              <CodeHighlight
                code={prettyPrintJson(arrayPairsToObject(selectedNode?.text))}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
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
