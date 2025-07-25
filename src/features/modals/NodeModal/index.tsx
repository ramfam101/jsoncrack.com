import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
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

  // Add local state for edit mode
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(nodeData);

  // Update editValue when nodeData changes
  React.useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
  }, [nodeData]);

  const handleSave = () => {
    // TODO: Save logic here (e.g., update the node in the store)
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            Content
            {!isEditing && (
              <button
                style={{
                  marginLeft: "auto",
                  padding: "2px 10px",
                  fontSize: "0.9em",
                  cursor: "pointer",
                  borderRadius: 4,
                  border: "1px solid #007bff",
                  background: "#007bff"
                }}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 120,
                  fontFamily: "monospace",
                  fontSize: 14,
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  resize: "vertical"
                }}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          {isEditing && (
            <Stack gap="xs" style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "2px 10px",
                  fontSize: "0.9em",
                  cursor: "pointer",
                  borderRadius: 4,
                  border: "1px solid #007bff",
                  background: "#007bff"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "2px 10px",
                  fontSize: "0.9em",
                  cursor: "pointer",
                  borderRadius: 4,
                  border: "1px solid #007bff",
                  background: "#007bff",
                  color: "#fff"
                }}
              >
                Save
              </button>
            </Stack>
          )}
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
