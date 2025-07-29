import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Group, Textarea } from "@mantine/core";
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
  const [editing, setEditing] = useState(false);
  const selectedNode = useGraph(state => state.selectedNode);
  const path = useGraph(state => state.selectedNode?.path || "");
  const updateNode = useGraph(state => state.updateNode);

  // Local state for editing
  const [editValue, setEditValue] = useState(() => dataToString(selectedNode?.text));

  // Keep editValue in sync when node changes
  React.useEffect(() => {
    setEditValue(dataToString(selectedNode?.text));
  }, [selectedNode]);

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group align="center" justify="space-between">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Group gap="xs">
              {!editing ? (
                <button
                  style={{
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    cursor: "pointer",
                    padding: "4px 12px",
                    fontWeight: 500,
                    color: "#222",
                  }}
                  onClick={() => setEditing(true)}
                  disabled={!selectedNode}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    style={{
                      background: "#4caf50",
                      border: "1px solid #388e3c",
                      borderRadius: 4,
                      cursor: "pointer",
                      padding: "4px 12px",
                      fontWeight: 500,
                      color: "#fff",
                    }}
                    onClick={() => {
                      if (selectedNode) {
                        try {
                          const parsed = JSON.parse(editValue);
                          // Maintain original format
                          const formatted = Array.isArray(selectedNode.text)
                            ? Object.entries(parsed)
                            : parsed;
                          updateNode(selectedNode.id, formatted);
                          setEditing(false);
                        } catch (e) {
                          alert("Invalid JSON");
                        }
                      }
                    }}
                  >
                    Save
                  </button>
                  <button
                    style={{
                      background: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      cursor: "pointer",
                      padding: "4px 12px",
                      fontWeight: 500,
                      color: "#222",
                    }}
                    onClick={() => {
                      setEditValue(dataToString(selectedNode?.text));
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </Group>
          </Group>
          {editing ? (
            <Textarea
              autosize
              minRows={6}
              maxRows={12}
              value={editValue}
              onChange={e => setEditValue(e.currentTarget.value)}
              style={{ fontFamily: "monospace", fontSize: 14 }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={dataToString(selectedNode?.text)}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
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
