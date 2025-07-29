import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { Group } from "@mantine/core";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

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
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(nodeData);
  const updateSelectedNode = useGraph(state => state.updateSelectedNode);

  // Update editValue if nodeData changes (e.g., when opening a different node)
  React.useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData]);

  const handleSave = () => {
    // Update the node in the store
    updateSelectedNode(editValue);
    setIsEditing(false);
    // Optionally close the modal or show a success message
  };
  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(nodeData); 
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
                style={{ width: "100%", minHeight: 150 }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
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
        {/* Edit/Save/Cancel Buttons */}
        {isEditing ? (
          <Group gap="xs" mt={16}>
            <div
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: 8,
                background: "none",
              }}
            >
              <button onClick={handleSave}>Save</button>
            </div>
            <div
              style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: 8,
              background: "none",
            }}
              > 
              <button onClick={handleCancel}>Cancel</button>
            </div>
          </Group>
        ) : (
          <div
            style={{
              padding: "4px 12px",
              border: "1px solid #ccc",
              borderRadius: 8,
              background: "none",
              marginTop: 16,
              display: "inline-block",
              width: "fit-content",
            }}
          >
            <button onClick={() => setIsEditing(true)}>Edit</button>
          </div>
        )}
      </Stack>
    </Modal>
  );
};
