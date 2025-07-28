import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";
import { updateJsonAtPath } from "../../../lib/utils/updateJsonAtPath";

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
  const nodeData = dataToString(selectedNode?.text);
  const path = selectedNode?.path || "";

  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // Reset edit value when modal opens or node changes
  useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
  }, [nodeData, opened]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setEditValue(nodeData);
    setIsEditing(false);
  };
  const updateNodeValue = useGraph(state => state.updateNodeValue);
  const setContents = useFile(state => state.setContents);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      if (selectedNode && typeof selectedNode.path === "string") {
        // Normalize path: remove {Root}. or similar prefix
        let normalizedPath = selectedNode.path.replace(/^{Root}\.?/, "");
        // Update left-hand editor with the full updated JSON
        const contents = useFile.getState().contents;
        let fullJson;
        try {
          fullJson = JSON.parse(contents);
        } catch {
          fullJson = {};
        }
        const updatedJson = updateJsonAtPath(fullJson, normalizedPath, parsed);
        const updatedJsonStr = JSON.stringify(updatedJson, null, 2);
        // Debug log
        console.log('[NodeModal] Saving node:', {
          path: selectedNode.path,
          normalizedPath,
          parsed,
          updatedJsonStr,
          fullJson,
        });
        setContents({ contents: updatedJsonStr });
        // Force graph update immediately
        const useJson = require("../../../store/useJson").default;
        useJson.getState().setJson(updatedJsonStr);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('[NodeModal] Failed to save node:', err);
      // Optionally show error
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>
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
          {isEditing ? (
            <Stack gap="xs" style={{ flexDirection: "row" }}>
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </Stack>
          ) : (
            <button onClick={handleEdit}>Edit</button>
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
