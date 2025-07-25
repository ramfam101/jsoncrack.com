import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

import { Button } from "@mantine/core"; // Button import was found with Copilot
import { useState } from "react"; // useState import was found with Copilot
import { Textarea } from "@mantine/core"; // Textarea import was found with Copilot

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");

  // COPILOT RECOMMENDATION
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // Update editValue when nodeData changes (optional, for modal reuse)
  React.useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData]);

  function handleSave()
  {
    updateSelectedNode(editValue);;
    setIsEditing(false);
  }

  updateSelectedNode: (newText) => (state => ({
  selectedNode: {
    ...state.selectedNode,
    text: newText,
  }}))

  function updateSelectedNode(editValue: string) {
    // Try to parse the edited value as JSON
    let parsed;
    try {
      parsed = JSON.parse(editValue);
    } catch (e) {
      // Optionally, show an error or ignore invalid JSON
      return;
    }
    // Update the selected node in the graph store
    useGraph.getState().setSelectedNode(parsed);
  }

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Button variant="filled" color="blue" style={{ float: "right", width: "25%" }} onClick={() => setIsEditing(!isEditing)}> { /* Toggle edit mode */ }
          {isEditing ? "Save" : "Edit"}
      </Button> {/* Component code for a button found with Copilot  ; Right alignment code also fixed with Copilot and originally based on https://stackoverflow.com/questions/6632340/place-a-button-right-aligned */}
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            { /*<CodeHighlight code={editValue} miw={350} maw={600} language="json" withCopyButton /> */ }
            { /* This code was overhauled to use a conditional using Copilot; I am not as proficient in the brief if/else to effectively write it. */ }
            {isEditing ? (
            <Textarea
              value={editValue}
              onChange={e => setEditValue(e.currentTarget.value)}
              minRows={10}
              autosize
              maw={600}
              miw={350}
            />
          ) : (
            <CodeHighlight code={editValue} miw={350} maw={600} language="json" withCopyButton />
          )}
          </ScrollArea.Autosize>
          <div style={{ display: "flex", gap: "8px" }}>
          {isEditing && (
            <Button
              variant="outline"
              color="gray"
              style={{ width: "25%" }}
              onClick={() => {
                setEditValue(nodeData); // Reset to original
                setIsEditing(false);    // Exit editing mode
              }}
            >
              Cancel
            </Button>
          )}
        </div>
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
