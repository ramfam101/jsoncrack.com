import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
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
  const selectedNode = useGraph(state => state.selectedNode)
  const updateNode = useGraph(state => state.updateNode);

  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");

  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  useEffect(() => {
    if (selectedNode?.text) {
      const content = JSON.stringify(selectedNode.text, null, 2);
      setEditableContent(content);
      setOriginalContent(content);
    }
  }, [selectedNode]);
  
  const handleSave = () => {
    try {
      let parsed = JSON.parse(editableContent);
      const nodeId = selectedNode!.id;

      // Normalize array of entries to object
      if (
        Array.isArray(parsed) &&
        parsed.every(entry => Array.isArray(entry) && entry.length === 2)
      ) {
        parsed = Object.fromEntries(parsed);
      }

      updateNode(nodeId, parsed);

      let fullJson = JSON.parse(useFile.getState().contents);
      const rawPath = useGraph.getState().path;

      const applyAtPath = (obj: any, path: string, value: any) => {
        if (!path) {
          // Root replacement
          return value;
        }

        const parts = path
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .filter(Boolean);

        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          const key = parts[i];
          const isIndex = !isNaN(Number(key));
          if (isIndex) {
            const index = Number(key);
            if (!Array.isArray(current)) current = [];
            if (!current[index]) current[index] = {};
            current = current[index];
          } else {
            if (!current[key] || typeof current[key] !== "object") {
              current[key] = {};
            }
            current = current[key];
          }
        }

        const lastKey = parts[parts.length - 1];
        const isLastIndex = !isNaN(Number(lastKey));
        if (isLastIndex) {
          current[Number(lastKey)] = value;
        } else {
          current[lastKey] = value;
        }

        return obj;
      };

      // ✅ Capture the updated root (in case it's replaced)
      const updatedJson = applyAtPath(fullJson, rawPath, parsed);

      // Save
      const updatedJsonString = JSON.stringify(updatedJson, null, 2);
      useFile.getState().setContents({ contents: updatedJsonString });

      setIsEditing(false);
      onClose?.();
    } catch (err) {
      alert("Invalid JSON format.");
    }
  };

  const handleCancel = () => {
    setEditableContent(originalContent);
    setIsEditing(false);
    onClose?.();
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Button variant="outline" onClick={() => setIsEditing(true)} size="xs" style={{ alignSelf: "flex-end"}}>
          Edit
        </Button>
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
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
        {isEditing && (
          <Modal
            title="Edit Node Content"
            size="auto"
            opened={isEditing}
            onClose={() => setIsEditing(false)}
            centered
          >
            <Stack py="sm" gap="sm">
              <Text fz="xs" fw={500}>Edit content of the node</Text>
              <textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.currentTarget.value)}
                style={{
                  minHeight: "200px",
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  whiteSpace: "pre-wrap",
                  overflow: "auto",
                }}
              />
            </Stack>
            <Group justify="flex-end">
              <Button color="green" onClick={handleSave}>Save</Button>
              <Button variant="default" onClick={handleCancel}>Cancel</Button>
            </Group>
          </Modal>
        )}
      </Stack>
    </Modal>
  );
};
