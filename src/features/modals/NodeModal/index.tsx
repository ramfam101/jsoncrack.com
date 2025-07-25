import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, Button } from "@mantine/core";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";


export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const updateNode = useGraph(state => state.updateNode);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(selectedNode?.text ?? "");

  React.useEffect(() => {
    setEditValue(selectedNode?.text ?? "");
    setIsEditing(false);
  }, [selectedNode]);

  const handleSave = () => {
    if (selectedNode) {
      updateNode(selectedNode.id, editValue);
      useJson.getState().updateJsonByNodeId(selectedNode.id, editValue);
    }
    setIsEditing(false);
    onClose(); // Optional: close modal after save
  };

  const handleCancel = () => {
    setEditValue(selectedNode?.text ?? "");
    setIsEditing(false);
    onClose(); // Optional: close modal after cancel
  };

  const isObject = typeof selectedNode?.text === "object" && selectedNode?.text !== null && !Array.isArray(selectedNode?.text);

  return (
    <Modal opened={opened} onClose={onClose}>
      <h2>Content</h2>
      {isEditing ? (
        <>
          {isObject ? (
            <Stack spacing="xs">
              {Object.entries(editValue).map(([key, value]) => (
                <div key={key}>
                  <Text>{key}:</Text>
                  <input
                    style={{ marginLeft: "8px" }}
                    value={value as string}
                    onChange={e => setEditValue((prev: any) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))}
                  />
                </div>
              ))}
            </Stack>
          ) : (
            <input
              value={editValue as string}
              onChange={e => setEditValue(e.target.value)}
            />
          )}
          <Stack mt="md" spacing="xs" direction="row">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="default" onClick={handleCancel}>Cancel</Button>
          </Stack>
        </>
      ) : (
        <>
          <div>
            {isObject
              ? Object.entries(selectedNode?.text ?? {}).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))
              : selectedNode?.text}
          </div>
          <Button mt="md" onClick={() => setIsEditing(true)}>Edit</Button>
        </>
      )}
    </Modal>
  );
};
