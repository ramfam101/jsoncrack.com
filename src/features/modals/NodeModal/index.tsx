import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile"; // Import your useFile store

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
  const updateNodeContent = useGraph(state => state.updateNodeContent);
  const setContents = useFile(state => state.setContents);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData ?? "");

  React.useEffect(() => {
    setEditValue(nodeData ?? "");
  }, [nodeData, opened]);

  const handleSave = () => {
    if (!editValue || typeof editValue !== "string") {
      alert("Content is empty or invalid.");
      return;
    }
    try {
      const parsedNode = JSON.parse(editValue);

      // Get the full JSON from the text editor
      const fullJson = JSON.parse(useFile.getState().getContents());

      // Extract the correct key from the path
      let key = path;
      if (key.startsWith("{Root}.")) {
        key = key.replace("{Root}.", "");
      }

      // Update only the relevant part using the node's key
      if (key) {
        fullJson[key] = parsedNode;
      }

      updateNodeContent(key, Object.entries(parsedNode));
      setContents({ contents: JSON.stringify(fullJson, null, 2) });

      setIsEditing(false);
      setEditValue(dataToString(parsedNode));
    } catch (e) {
      alert("Invalid JSON format.");
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
                style={{ width: "100%", minHeight: 150 }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          <Group gap="xs">
            {isEditing ? (
              <>
                <button onClick={handleSave}>Save</button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}>Edit</button>
            )}
          </Group>
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
