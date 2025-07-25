import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(nodeData);

  const handleSave = () => {
    // Validate JSON before saving
    const parsedData = JSON.parse(editedData);

    // Update the graph store with the edited data
    useGraph.setState(state => {
      if (state.selectedNode) {
        const updatedNode = {
          ...state.selectedNode,
          text: parsedData,
        };

        // Update the selected node and nodes array
        state.selectedNode = updatedNode;
        state.nodes = state.nodes.map(node =>
          node.id === state.selectedNode?.id ? updatedNode : node
        );

        // Update the global JSON data to reflect changes
        const updatedJsonData = { ...state.jsonData };
        const pathSegments = path.split(".");
        let current = updatedJsonData;

        // Traverse the JSON structure to update the specific node
        for (let i = 0; i < pathSegments.length - 1; i++) {
          if (!current[pathSegments[i]]) {
            // Initialize missing keys as empty objects
            current[pathSegments[i]] = {};
          }
          current = current[pathSegments[i]];
        }

        // Update the final node
        current[pathSegments[pathSegments.length - 1]] = parsedData;

        // Update the jsonData state
        state.jsonData = updatedJsonData;
      }
      return state;
    });

    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs" style={{ position: "relative" }}>
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing ? (
            <Textarea
              value={editedData}
              onChange={e => setEditedData(e.target.value)}
              autosize
              minRows={4}
              maxRows={10}
              style={{ minWidth: 350, maxWidth: 600 }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          )}
          <Button
            size="xs"
            style={{ position: "absolute", top: 0, right: 0 }}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </Stack>
        {isEditing && (
          <Button color="teal" onClick={handleSave}>
            Save Changes
          </Button>
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

const JsonViewer = () => {
  const jsonData = useGraph(state => state.jsonData);

  return <pre>{JSON.stringify(jsonData, null, 2)}</pre>;
};
