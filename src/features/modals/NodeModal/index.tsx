import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
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
  const setNodeText = useGraph(state => state.setNodeText); // <-- Add this line if your store has a setter

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  React.useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
  }, [nodeData]);

  // Save handler
  const handleDone = () => {
    try {
      const parsed = JSON.parse(editValue);
      setNodeText(parsed); // Save as object

      const fileJson = JSON.parse(useFile.getState().contents);
      if (path && fileJson[path]) {
        fileJson[path] = parsed; // Save as object
        useFile.getState().setContents({ contents: JSON.stringify(fileJson, null, 2) });
      }
      setIsEditing(false);
    } catch (e) {
      alert("Invalid JSON");
    }
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
                style={{ width: "100%", minHeight: 150, fontFamily: "monospace" }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          <button
            onClick={() => {
              if (isEditing) {
                handleDone();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? "Done" : "Edit"}
          </button>
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