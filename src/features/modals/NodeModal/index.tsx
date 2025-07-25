import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

const dataToString = (data: any) => {
  return JSON.stringify(data, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const setNodeText = useGraph(state => state.setNodeText);
  const setContents = useFile(state => state.setContents); // <-- use inside component

  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(dataToString(selectedNode?.text));

  useEffect(() => {
    setEditValue(dataToString(selectedNode?.text));
  }, [selectedNode]);

  const path = selectedNode?.path || "";

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      setNodeText(parsed, path); // Update visualization

      // Update JSON editor
      const json = useFile.getState().contents;
      let updatedJson = JSON.parse(JSON.stringify(json));
      if (path === "{Root}") {
        updatedJson = parsed;
      } else if (path) {
        const keys = path.replace(/^{Root}\.?/, "").split(".");
        let obj = updatedJson;
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = parsed;
      }
      setContents(updatedJson);

      setEditMode(false);
    } catch {
      // Optionally show error
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs" style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text fz="xs" fw={500}>Content</Text>
            {editMode ? (
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="xs" color="green" variant="filled" onClick={handleSave}>Save</Button>
                <Button size="xs" color="gray" variant="filled" onClick={() => setEditMode(false)}>Cancel</Button>
              </div>
            ) : (
              <Button size="xs" color="blue" variant="filled" onClick={() => setEditMode(true)}>Edit</Button>
            )}
          </div>
          {editMode ? (
            <Textarea
              value={editValue}
              onChange={e => setEditValue(e.currentTarget.value)}
              autosize
              minRows={6}
              maxRows={12}
              styles={{ input: { fontFamily: "monospace", minWidth: 350, maxWidth: 600 } }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={dataToString(selectedNode?.text)} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
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
