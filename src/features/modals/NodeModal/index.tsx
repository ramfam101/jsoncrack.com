import { useEffect, useState } from "react"; // make sure this is imported
import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
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
  const selectedNode = useGraph(state => state.selectedNode);
  const path = useGraph(state => state.selectedNode?.path || "");
  const jsonStore = useJson.getState();
  const setGraph = useGraph(state => state.setGraph);

  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(""); 

  useEffect(() => {
    if (opened && selectedNode?.text) {
      const convert = (data: any) => 
        Array.isArray(data) ? Object.fromEntries(data) : data;
      setTempValue(JSON.stringify(convert(selectedNode.text), null, 2));
      }
    }, [opened, selectedNode]);

  const handleSave = () => {
    try {
      const fullJson = JSON.parse(jsonStore.json);
      const cleanPath = path.replace("{Root}.", "").trim();
      const parts = cleanPath.split(".");      
      let current = fullJson;

      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = JSON.parse(tempValue);

      const updatedJson = JSON.stringify(fullJson, null, 2);
      useFile.getState().setContents({ contents: updatedJson});
      setGraph(updatedJson);
      setIsEditing(false);
      onClose();
    } catch (e) {
      alert("Invalid JSON or update path.");
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
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                style={{ width: "100%", height: "200px", fontFamily: "monospace", fontSize: "14px" }}
              />
            ) : (
              <CodeHighlight
                code={JSON.stringify(selectedNode?.text, null, 2)}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
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
            withCopyButton
          />
        </ScrollArea.Autosize>

        {isEditing ? (
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "10px" }}>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: "#22c55e",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                padding: "6px 16px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
          </div>
        )}
      </Stack>
      </Modal>
  );
};
