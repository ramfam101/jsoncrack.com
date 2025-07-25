import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";

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
  const [editMode, setEditMode] = useState(false);
  const [editedValue, setEditedValue] = useState("");
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text) || "");
  const path = useGraph(state => state.selectedNode?.path || "");

  useEffect(() => {
    if (editMode && selectedNode) {
      if (typeof selectedNode.text === "object" && !Array.isArray(selectedNode.text)) {
        setEditedValue(JSON.stringify(selectedNode.text, null, 2));
      } else {
        setEditedValue(dataToString(selectedNode.text));
      }
    }
  }, [editMode, selectedNode]);

  function getParentAndKeyFromPath(parsed, path) {
    const cleanedPath = path.replace(/\{Root\}/, "").replace(/^\./, "");
    const pathParts = cleanedPath.split(".").filter(Boolean);
    if (pathParts.length === 1) {
      return { parent: parsed, key: pathParts[0] };
    }
    let ref = parsed;
    for (let i = 0; i < pathParts.length - 1; i++) {
      ref = ref[pathParts[i]];
    }
    return { parent: ref, key: pathParts[pathParts.length - 1] };
  }

  const handleSave = () => {
    if (!selectedNode) return;
    const json = useJson.getState().getJson();
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch {
      return;
    }
    const { parent, key } = getParentAndKeyFromPath(parsed, path);
    let newValue;
    try {
      newValue = JSON.parse(editedValue);
    } catch {
      newValue = editedValue;
    }
    if (parent && key) {
      parent[key] = newValue;
    } else if (key) {
      parsed[key] = newValue;
    }
    useJson.getState().setJson(JSON.stringify(parsed, null, 2));
    setEditMode(false);
    onClose();
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedValue(dataToString(selectedNode?.text));
    onClose();
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {editMode ? (
            <textarea
              style={{ width: "100%", minHeight: 100 }}
              value={editedValue}
              onChange={e => setEditedValue(e.target.value)}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData || ""} miw={350} maw={600} language="json" withCopyButton />
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
        <Stack gap="sm" style={{ flexDirection: "row" }}>
          {editMode ? (
            <>
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)}>Edit</button>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
};
