import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  return JSON.stringify(text, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const selectedNode = useGraph(state => state.selectedNode);
  const updateNode = useGraph(state => state.updateNode);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // Update editValue whenever nodeData or selectedNode changes
  React.useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData, selectedNode, opened]);

  const handleSave = () => {
    try {
      console.log("editValue:", editValue);
      const parsed = JSON.parse(editValue);
      if (selectedNode) {
        updateNode(selectedNode, parsed);
        setIsEditing(false);
      } else {
        alert("No node selected to update.");
      }
    } catch (e) {
      alert("Invalid JSON: " + (e as Error).message);
    }
  };

  const editButtonStyle = {
    backgroundColor: "green",
    paddingLeft: "0.5rem",
    paddingRight: "0.5rem",
    marginLeft: "auto",
    marginRight: "0.5rem",
    borderRadius: "0.75rem",
    color: "white",
    cursor: "pointer",
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        {!isEditing ? (
          <button style={editButtonStyle} onClick={() => setIsEditing(true)}>Edit</button>
        ) : (
          <>
            <textarea
              style={{ width: "100%", minHeight: 100 }}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
            />
            <button style={{ ...editButtonStyle, backgroundColor: "blue" }} onClick={handleSave}>Save</button>
            <button style={{ ...editButtonStyle, backgroundColor: "gray" }} onClick={() => setIsEditing(false)}>Cancel</button>
          </>
        )}
        {!isEditing && (
          <Stack gap="xs">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
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
