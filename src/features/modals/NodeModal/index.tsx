import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button } from "@mantine/core";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text) || "");
  const path = useGraph(state => state.selectedNode?.path || "");
  const updateNodeContent = useGraph(state => state.updateNodeContent);

  // Reset edited content when modal opens with new node
  useEffect(() => {
    if (opened && selectedNode) {
      setEditedContent(selectedNode.text as string);
      setIsEditing(false);
    }
  }, [opened, selectedNode]);
  
  const handleSave = () => {
    if (editedContent && selectedNode) {
      updateNodeContent(editedContent.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    setEditedContent(selectedNode?.text as string); 
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              style={{ width: "100%", height: "150px", fontFamily: "monospace" }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            {isEditing ? (
              <>
                <Button color="green" onClick={handleSave}>Save Changes</Button>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              </>
            ) : (
              <Button color="blue" onClick={() => {
                setEditedContent(selectedNode?.text as string);
                setIsEditing(true);
              }}>Edit Node Content</Button>
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
