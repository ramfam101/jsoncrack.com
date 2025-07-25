import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { parseNodePath, setValueAtPath, parseNodeValue } from "../../../lib/utils/nodeUpdateUtils";
import useFile from "../../../store/useFile";
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
    try {
      // Get current JSON
      const currentJsonString = useJson.getState().getJson();
      const currentJson = JSON.parse(currentJsonString);
      
      // Parse the node path
      const jsonPath = parseNodePath(path);
      
      // Parse the new value
      const newValue = parseNodeValue(editValue);
      
      // Update the JSON at the specific path
      const updatedJson = setValueAtPath(currentJson, jsonPath, newValue);
      
      // Convert back to string with formatting
      const updatedJsonString = JSON.stringify(updatedJson, null, 2);
      
      // Update the file contents (this will trigger the chain of updates)
      useFile.getState().setContents({ contents: updatedJsonString });
      
      setIsEditing(false);
      
    } catch (error) {
      console.error("Error saving node:", error);
      // Could add error state here if needed
    }
  };

 const handleCancel = () => {
    setEditValue(nodeData); // Reset to original value
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
                onClick={handleCancel}
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
