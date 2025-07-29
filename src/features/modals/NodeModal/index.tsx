import React, { useState } from "react";
import { Button } from "@mantine/core";
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
  const path = useGraph(state => state.selectedNode?.path || "");

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    selectedNode ? dataToString(selectedNode.text) : ""
  );

  // Update editValue when selectedNode changes
  React.useEffect(() => {
    setEditValue(selectedNode ? dataToString(selectedNode.text) : "");
  }, [selectedNode]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    try {
      const newText = JSON.parse(editValue);
      useGraph.getState().setSelectedNode({
        ...selectedNode,
        id: selectedNode?.id ?? "",
        width: selectedNode?.width ?? 0,
        height: selectedNode?.height ?? 0,
        text: newText,
        data: selectedNode?.data ?? {
          type: "object", // Use your default NodeType here
          isParent: false,
          isEmpty: false,
          childrenCount: 0,
        },
      });
      setIsEditing(false);
      onClose?.();
    } catch (error) {
      alert("Invalid JSON format. Please check your input.");
    }
  };

  const nodeData = selectedNode ? dataToString(selectedNode.text) : "";

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing ? (
            <textarea
              style={{ width: "100%", minHeight: 120, fontFamily: "monospace" }}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          )}
        </Stack>

        {isEditing ? (
          <Button onClick={handleSave} mt="sm" variant="filled" size="xs" color="green">
            Save
          </Button>
        ) : (
          <Button onClick={handleEdit} mt="sm" variant="outline" size="xs" color="red">
            Edit
          </Button>
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