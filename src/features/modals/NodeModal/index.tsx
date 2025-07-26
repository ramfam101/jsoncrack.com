import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, Button } from "@mantine/core";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph((s) => s.selectedNode);
  const updateNode   = useGraph((s) => s.updateNode);

  const [isEditing, setIsEditing] = useState(false);
  const [rawInput,  setRawInput]  = useState("");

  // Helper: if someone passed an array-of-entries, turn it back into an object
  const normalize = (val: any): any => {
    if (
      Array.isArray(val) &&
      val.every(
        (item) =>
          Array.isArray(item) &&
          item.length === 2 &&
          typeof item[0] === "string"
      )
    ) {
      return Object.fromEntries(val);
    }
    return val;
  };

  // Whenever the selectedNode changes, load its value into rawInput
  useEffect(() => {
    const v = normalize(selectedNode?.text);
    setRawInput(
      typeof v === "object"
        ? JSON.stringify(v, null, 2)
        : String(v ?? "")
    );
    setIsEditing(false);
  }, [selectedNode]);

  const handleSave = () => {
    if (!selectedNode) return;

    // 1) parse the user’s edits
    let parsed: any;
    try {
      parsed = JSON.parse(rawInput);
    } catch {
      return alert("Invalid JSON. Please fix your syntax.");
    }

    // 2) update the graph node (keeps it as object)
    updateNode(selectedNode.id, parsed);

    // 3) update the internal JSON tree
    useJson.getState().updateJsonByNodeId(selectedNode.id, parsed);

    // 4) push that new tree back into the left‑pane text editor
    const updated = useJson.getState().getJson();
    useFile.getState().setContents({
      contents:  updated,
      hasChanges: true,
      skipUpdate: true,
    });

    // 5) close modal
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    const v = normalize(selectedNode?.text);
    setRawInput(
      typeof v === "object"
        ? JSON.stringify(v, null, 2)
        : String(v ?? "")
    );
    setIsEditing(false);
    onClose();
  };

  // In view mode, pretty‑print any object/array, otherwise show raw string
  const renderPreview = () => {
    const txt = normalize(selectedNode?.text);
    if (typeof txt === "object" && txt !== null) {
      return JSON.stringify(txt, null, 2);
    }
    return String(txt ?? "");
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Node Content" centered>
      <Text fw={600} mb="xs">Content</Text>

      {isEditing ? (
        <>
          <textarea
            style={{
              width: "100%",
              height: 200,
              fontFamily: "monospace",
              backgroundColor: "#1a1a1a",
              color: "white",
              padding: 10,
              borderRadius: 6,
              border: "1px solid #444",
            }}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
          />

          <Stack mt="md" spacing="xs" direction="row">
            <Button color="green" onClick={handleSave}>Save</Button>
            <Button variant="default" onClick={handleCancel}>Cancel</Button>
          </Stack>
        </>
      ) : (
        <>
          <pre
            style={{
              whiteSpace:  "pre-wrap",
              fontFamily: "monospace",
              background: "#1a1a1a",
              color:      "white",
              padding:    12,
              borderRadius: 8,
            }}
          >
            {renderPreview()}
          </pre>
          <Button mt="md" onClick={() => setIsEditing(true)}>Edit</Button>
        </>
      )}

      <Text mt="xl" size="sm" color="dimmed">JSON Path</Text>
      <pre
        style={{
          background: "#1a1a1a",
          color:      "white",
          padding:    8,
          borderRadius: 6,
          fontFamily: "monospace",
        }}
      >
        {selectedNode?.path ?? "{Root}"}
      </pre>
    </Modal>
  );
};
