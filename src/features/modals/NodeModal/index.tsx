import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile"; // Add this import
import { parse, modify, printParseErrorCode, ParseError } from "jsonc-parser"; // Add this import

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
  const selectedNode = useGraph(state => state.selectedNode);

  const setContents = useFile(state => state.setContents); // Get setContents from useFile
  const contents = useFile(state => state.contents); // Get the current JSON string

  // Add local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // Helper to update value at path in JSON
  function updateJsonAtPath(json: string, path: string, value: any): string {
    try {
      const errors: ParseError[] = [];
      const data = parse(json, errors);
      if (errors.length) throw new Error(printParseErrorCode(errors[0].error));

      // Remove "{Root}" or "root" from the start of the path
      const cleanedPath = path.replace(/^\{?Root\}?\.?/, "").replace(/^root\.?/, "");

      // Convert path like "items[2].name" to array
      const pathArr = cleanedPath
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter(Boolean);

      let ref: any = data;
      for (let i = 0; i < pathArr.length - 1; i++) {
        if (ref[pathArr[i]] === undefined) {
          throw new Error(`Path not found: ${pathArr.slice(0, i + 1).join('.')}`);
        }
        ref = ref[pathArr[i]];
      }
      if (ref === undefined) {
        throw new Error(`Path not found: ${pathArr.slice(0, -1).join('.')}`);
      }
      ref[pathArr[pathArr.length - 1]] = value;

      return JSON.stringify(data, null, 2);
    } catch (e) {
      alert("Failed to update JSON: " + e);
      return json;
    }
  }

  // Save handler (replace with your update logic)
  const handleSave = () => {
    if (selectedNode && path) {
      // Try to parse the editValue as JSON, fallback to string
      let newValue: any = editValue;
      try {
        newValue = JSON.parse(editValue);
      } catch {
        // If not valid JSON, keep as string
      }
      const updated = updateJsonAtPath(contents, path, newValue);
      setContents({ contents: updated });
    }
    setIsEditing(false);
  };

  // Cancel handler
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
              <div style={{ display: "flex", gap: 8 }}>
                <textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  style={{ width: "100%", fontSize: 12 }}
                  rows={4}
                />
              </div>
            ) : (
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          <div style={{ marginTop: 8 }}>
            {isEditing ? (
              <>
                <button onClick={handleSave} style={{ marginRight: 8 }}>
                  Save
                </button>
                <button onClick={handleCancel}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}>Edit</button>
            )}
          </div>
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
