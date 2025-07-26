import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) => {
  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return typeof data === "string" ? data : String(data);
  };

};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const updateNodeText = useGraph(state => state.updateNodeText);

  const path = selectedNode?.path || "";
  const originalText = selectedNode?.text || "";

  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
  let newValue = "";

  if (typeof originalText === "string") {
    newValue = originalText; // already a string, use as-is
  } else if (typeof originalText === "object" && originalText !== null) {
    try {
      newValue = JSON.stringify(originalText, null, 2); // convert object to JSON string
    } catch {
      newValue = String(originalText); // fallback if stringify fails
    }
  }

  setTempValue(newValue);
  setIsEditing(false);
}, [originalText]);

    const isValidJson = (str: string) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

const handleSave = () => {
  if (!selectedNode || typeof tempValue !== "string") return;

  if (!isValidJson(tempValue)) {
    alert("Please correct the JSON formatting before saving.");
    return;
  }

  updateNodeText(selectedNode.id, JSON.parse(tempValue));
  setIsEditing(false);
};


  
  const handleCancel = () => {
    const resetValue =
      typeof originalText === "string"
        ? originalText
        : JSON.stringify(Object.fromEntries(originalText || []), null, 2);

    setTempValue(resetValue);
    setIsEditing(false);
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>

          {selectedNode?.text !== undefined && (
            isEditing ? (
              <Stack gap="xs">
                <textarea
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "140px",
                    padding: "8px",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px"
                  }}
                />
                <Group gap="xs">
                  <button onClick={handleSave}>Save</button>
                  <button onClick={handleCancel}>Cancel</button>
                </Group>
              </Stack>
            ) : (
              <Stack gap="xs">
                <ScrollArea.Autosize mah={250} maw={600}>
                  <CodeHighlight
                    code={dataToString(originalText)}
                    miw={350}
                    maw={600}
                    language="json"
                    withCopyButton
                  />
                </ScrollArea.Autosize>
                <button onClick={() => setIsEditing(true)}>Edit</button>
              </Stack>
            )
          )}
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
