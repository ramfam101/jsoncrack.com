import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

// This turns the node data into a JSON string for editing
const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };
  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  // Gets the node's data and path for display and editing
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const selectedNode = useGraph(state => state.selectedNode);

  // For updating the JSON used in the app and the code editor on the left
  const setJson = useJson(state => state.setJson);
  const setContents = useFile(state => state.setContents);

  // These are for tracking if we're in edit mode, and what is in the edit box
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // This keeps the edit box in sync with the node, so it always shows the right value
  useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData, editMode]);

  // What happens when you click Save after editing
  const handleSave = () => {
    try {
      // Turn the edit box value into an object
      const newNode = JSON.parse(editValue);

      // Get the full JSON tree
      const fullJson = JSON.parse(useJson.getState().getJson());

      // Use the node's path to find where it is in the tree, and update it
      const nodePath = path.replace("{Root}.", "").split(".");
      let curr = fullJson;
      for (let i = 0; i < nodePath.length - 1; i++) {
        curr = curr[nodePath[i]];
      }
      curr[nodePath[nodePath.length - 1]] = newNode;

      // Make the whole JSON pretty
      const newJsonString = JSON.stringify(fullJson, null, 2);

      // Update the state so everything is refreshed
      setJson(newJsonString);
      setContents({ contents: newJsonString });

      // Refresh the selected node in the state so modal content updates right away
      setSelectedNode({ ...selectedNode, text: newNode });

      // Go back to non-edit mode
      setEditMode(false);
    } catch (e) {
      alert("Invalid JSON format.");
    }
  };

  // What happens if you click Cancel (just go back, nothing changes)
  const handleCancel = () => {
    setEditMode(false);
    setEditValue(nodeData);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs" direction="row" justify="space-between" align="center">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {!editMode && (
            <Button size="xs" onClick={() => setEditMode(true)}>
              Edit
            </Button>
          )}
        </Stack>
        <ScrollArea.Autosize mah={250} maw={600}>
          {!editMode ? (
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
          ) : (
            <Textarea
              minRows={6}
              value={editValue}
              onChange={e => setEditValue(e.currentTarget.value)}
              autosize
              maw={600}
            />
          )}
        </ScrollArea.Autosize>
        {editMode && (
          <Stack direction="row" gap="xs">
            <Button size="xs" color="green" onClick={handleSave}>
              Save
            </Button>
            <Button size="xs" variant="outline" color="gray" onClick={handleCancel}>
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
