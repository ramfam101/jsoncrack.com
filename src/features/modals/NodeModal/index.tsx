import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile"; // <-- Add this import

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const node = useGraph(state => state.selectedNode);
  const nodeData = dataToString(node?.text);
  const path = node?.path || "";

  // Add state for edit mode and editable content
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  const setContents = useFile(state => state.setContents); // <-- Add this line
  const nodes = useGraph(state => state.nodes); // <-- Add this line if not already present

  // Optional: update editValue if nodeData changes (e.g., when switching nodes)
  React.useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
  }, [nodeData]);

  // Save handler (implement update logic as needed)
  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);

      const formatted =
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? Object.entries(parsed)
          : parsed;

      useGraph.getState().updateNodeText(path, formatted);

      // Reconstruct the original JSON from the graph nodes
      const updatedNodes = useGraph.getState().nodes;
      const reconstructedJson = graphToJson(updatedNodes);

      setContents({ contents: JSON.stringify(reconstructedJson, null, 2) });

      setIsEditing(false);
    } catch (e) {
      alert("Invalid JSON format.");
    }
  };

  // Cancel handler
  const handleCancel = () => {
    setEditValue(nodeData);
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          ) : (
            <Group gap="xs">
              <Button color="green" onClick={handleSave}>Save</Button>
              <Button color="red" variant="outline" onClick={handleCancel}>Cancel</Button>
            </Group>
          )}
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {!isEditing ? (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            ) : (
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                minRows={8}
                autosize
                style={{ minWidth: 350, maxWidth: 600, fontFamily: "monospace" }}
              />
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

function graphToJson(nodes) {
  // Find the root node (usually path === "{Root}")
  const rootNode = nodes.find(n => n.path === "{Root}");
  if (!rootNode) return {};

  // Helper to recursively build JSON from nodes
  function buildObject(parentPath) {
    const children = nodes.filter(
      n => n.path.startsWith(parentPath + ".") && n.path.split(".").length === parentPath.split(".").length + 1
    );
    let obj = {};
    for (const child of children) {
      const key = child.path.split(".").pop().replace(/^\{Root\}\.?/, "");
      if (Array.isArray(child.text)) {
        // Object node
        obj[key] = Object.fromEntries(child.text);
      } else {
        // Primitive node
        obj[key] = child.text;
      }
    }
    return obj;
  }

  // Build the top-level object
  return buildObject("{Root}");
}