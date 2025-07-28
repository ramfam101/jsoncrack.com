import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Text, Button } from "@mantine/core";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(s => s.selectedNode);
  const updateNode = useGraph(s => s.updateNode);
  const [isEditing, setIsEditing] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const value = selectedNode?.text;
    setRawInput(
      typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value ?? "")
    );
    setIsEditing(false);
  }, [selectedNode]);

  const handleSave = () => {
    if (!selectedNode) return;

    let parsed: any;
    try {
      parsed = JSON.parse(rawInput);

      // Auto-convert [["key", "value"]] → { key: value }
      if (Array.isArray(parsed) && parsed.every(p => Array.isArray(p) && p.length === 2)) {
        parsed = Object.fromEntries(parsed);
      }

      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        alert("Please enter a valid JSON object like { \"key\": \"value\" }.");
        return;
      }

    } catch {
      alert("Invalid JSON. Please fix your syntax.");
      return;
    }

    // Update graph state
    updateNode(selectedNode.id, parsed);
    useJson.getState().updateJsonByNodeId(selectedNode.id, parsed);

    // Push to left-hand editor
    const updated = useJson.getState().getJson();
    useFile.getState().setContents({
      contents: updated,
      hasChanges: true,
      skipUpdate: true,
    });

    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    const value = selectedNode?.text;
    setRawInput(
      typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value ?? "")
    );
    setIsEditing(false);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Node Content" centered>
      <Text fw={600} mb="xs">Content</Text>

      {isEditing ? (
        <>
          <textarea
            style={{
              width: "100%",
              height: "200px",
              fontFamily: "monospace",
              backgroundColor: "#1a1a1a",
              color: "white",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #444",
            }}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
          />

          <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
            <Button color="green" onClick={handleSave} loading={isSaving}>Save</Button>
            <Button variant="default" onClick={handleCancel}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <pre style={{
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            background: "#1a1a1a",
            color: "white",
            padding: "12px",
            borderRadius: "8px",
          }}>
            {(() => {
              const txt = selectedNode?.text;
              try {
                return JSON.stringify(JSON.parse(String(txt)), null, 2);
              } catch {
                return String(txt ?? "");
              }
            })()}
          </pre>
          <Button mt="md" onClick={() => setIsEditing(true)}>Edit</Button>
        </>
      )}

      <Text mt="xl" size="sm" color="dimmed">JSON Path</Text>
      <pre style={{
        background: "#1a1a1a",
        color: "white",
        padding: "8px",
        borderRadius: "6px",
        fontFamily: "monospace",
      }}>
        {selectedNode?.path ?? "{Root}"}
      </pre>
    </Modal>
  );
};
