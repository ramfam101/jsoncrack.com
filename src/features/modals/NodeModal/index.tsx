import React, { useState } from "react";
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
  const selectedNode = useGraph(state => state.selectedNode);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(() =>
    selectedNode?.text ? JSON.stringify(selectedNode.text, null, 2) : ""
  );

  // Update editValue if node changes
  React.useEffect(() => {
    setEditValue(selectedNode?.text ? JSON.stringify(selectedNode.text, null, 2) : "");
    setIsEditing(false);
  }, [selectedNode]);

  const path = useGraph(state => state.selectedNode?.path || "");

  // Save handler (replace with your update logic)
  const handleSave = () => {
    // TODO: update the node in your store here
    // Example: useGraph.getState().updateNodeText(selectedNode.id, JSON.parse(editValue));
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
              <textarea
                style={{
                  width: "100%",
                  minWidth: 350,
                  maxWidth: 600,
                  minHeight: 120,
                  fontFamily: "monospace",
                  fontSize: 14,
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  resize: "vertical"
                }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
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
          {isEditing ? (
            <Stack gap="xs" direction="row">
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
            </Stack>
          ) : (
            <button onClick={() => setIsEditing(true)}>Edit</button>
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
