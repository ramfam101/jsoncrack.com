import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeRaw = useGraph(state => state.selectedNode?.text);
  const nodeObject = Array.isArray(nodeRaw) ? Object.fromEntries(nodeRaw) : nodeRaw;
  const nodeData = JSON.stringify(nodeObject, null, 2);
  const path = useGraph(state => state.selectedNode?.path || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const updateNode = useGraph(state => state.updateNode);
  const nodes = useGraph(state => state.nodes);

  React.useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData, opened]);

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing ? (
            <>
              <textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                rows={8}
                style={{ width: "100%", marginBottom: "8px" }}
              />
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(editValue);
                    const toSave = Array.isArray(nodeRaw)
                      ? Object.entries(parsed)
                      : parsed;
                    updateNode(path, toSave);
                    setIsEditing(false);
                  } catch (e) {
                    alert("Invalid JSON format!");
                  }
                }}
                style={{ marginRight: "8px" }}
              >
                Save
              </button>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <ScrollArea.Autosize mah={250} maw={600}>
                <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
              </ScrollArea.Autosize>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditValue(nodeData);
                }}
                style={{ marginTop: "8px" }}
              >
                Edit
              </button>
            </>
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