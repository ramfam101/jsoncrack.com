import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
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
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = dataToString(selectedNode?.text ?? {}); // Ensure fallback to empty object
  const path = useGraph(state => state.selectedNode?.path || "");
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const updateNode = useGraph(state => state.updateNode);
  const setContents = useFile(state => state.setContents);
  const contents = useFile(state => state.contents);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  // Reset edit value when node changes or modal opens
  React.useEffect(() => {
    setEditValue(nodeData);
    setIsEditing(false);
  }, [nodeData, opened]);

  // Save handler
  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      updateNode(selectedNode.id, parsed);

      // Update the JSON editor contents
      // Parse current contents, update the node at the correct path, then stringify
      let json = JSON.parse(contents);
      // Utility to update by path, e.g. {Root}.fruit
      function setByPath(obj, path, value) {
        const keys = path.replace("{Root}.", "").split(".");
        let curr = obj;
        for (let i = 0; i < keys.length - 1; i++) {
          curr = curr[keys[i]];
        }
        curr[keys[keys.length - 1]] = value;
      }
      setByPath(json, path, parsed);
      setContents({ contents: JSON.stringify(json, null, 2) });

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
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.currentTarget.value)}
                autosize
                minRows={6}
                maxRows={12}
                styles={{
                  input: { fontFamily: "monospace", fontSize: 14 }
                }}
              />
            ) : (
              <CodeHighlight
                code={typeof nodeData === "string" ? nodeData : ""}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
          <Stack direction="row" gap="xs" mt="xs">
            {!isEditing ? (
              <Button
                variant="light"
                color="blue"
                style={{ background: "rgba(0,123,255,0.2)", color: "#007bff" }}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button
                  color="green"
                  style={{ background: "#28a745", color: "#fff" }}
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  color="gray"
                  style={{ background: "#6c757d", color: "#fff" }}
                  onClick={() => {
                    setEditValue(nodeData);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Stack>
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
