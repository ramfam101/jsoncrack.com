import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const { selectedNode, setSelectedNode, nodes, setGraph } = useGraph(); // Access graph state
  const { setJson } = useJson(); // Access JSON state

  const [isEditing, setIsEditing] = useState(false); // Toggle between view and edit modes
  const [editedContent, setEditedContent] = useState(
    selectedNode?.text ? JSON.stringify(selectedNode.text, null, 2) : ""
  ); // Editable JSON content

  const handleEditToggle = () => {
    setIsEditing(!isEditing); // Toggle edit mode
  };

  const handleSave = () => {
    if (selectedNode) {
      try {
        const updatedContent = JSON.parse(editedContent); // Parse the edited JSON

        // Update the selected node
        const updatedNode = {
          ...selectedNode,
          text: updatedContent,
        };
        setSelectedNode(updatedNode);

        // Update the nodes array in the graph state
        const updatedNodes = nodes.map((node) =>
          node.id === selectedNode.id ? updatedNode : node
        );
        setGraph(JSON.stringify({ nodes: updatedNodes }));

        // Update the JSON state
        const jsonState = useJson.getState().json || {}; // Ensure it's an object
        const updatedJson = {
          ...jsonState,
          nodes: updatedNodes,
        };
        setJson(JSON.stringify(updatedJson));

        // Exit edit mode
        setIsEditing(false);
        onClose();
      } catch (error) {
        alert("Invalid JSON format. Please correct it before saving.");
      }
    }
  };

  const handleCancel = () => {
    // Revert to the original content and exit edit mode
    setEditedContent(selectedNode?.text ? JSON.stringify(selectedNode.text, null, 2) : "");
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.currentTarget.value)}
                autosize
                minRows={6}
                maxRows={12}
              />
            ) : (
              <CodeHighlight
                code={dataToString(selectedNode?.text)}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={selectedNode?.path || ""}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}></div>
          {isEditing ? (
            <>
              <Button color="green" onClick={handleSave}>
                Save
              </Button>
              <Button color="red" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEditToggle}>Edit</Button>
          )}
        </Stack>
    </Modal>
  );
};