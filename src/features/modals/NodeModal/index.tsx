import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Button,
  Textarea,
  Group,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  return JSON.stringify(text, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph((state) => state.selectedNode);
 const updateNode = useGraph((state) => state.updateNode);
 const setJson = useJson((state) => state.setJson);
  const setContents = useFile((state) => state.setContents);
  const path = selectedNode?.path || "";
  const initialText = selectedNode?.text ? dataToString(selectedNode.text) : "";

  const [editing, setEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(initialText);

  useEffect(() => {
    setEditedValue(initialText);
    setEditing(false);
  }, [initialText, opened]);

  const handleSave = () => {
  try {
    const parsed = JSON.parse(editedValue);
    if (selectedNode?.id && selectedNode?.path) {
      // ✅ Update the node's local state
      updateNode(selectedNode.id, parsed);

      // ✅ Now update the global JSON
      const currentJson = JSON.parse(useJson.getState().json);
      const path = selectedNode.path.replace(/^\{Root\}\.?/, "");
      const parts = path.split(".").filter(Boolean);

      let ref = currentJson;
      for (let i = 0; i < parts.length - 1; i++) {
        ref = ref[parts[i]] ??= {};
      }
      if (parts.length > 0) {
        ref[parts[parts.length - 1]] = parsed;
      } else {
        // Editing root object
        Object.assign(currentJson, parsed);
      }

      const newJsonStr = JSON.stringify(currentJson, null, 2);
      setJson(newJsonStr);
      setContents({ contents: newJsonStr, skipUpdate: false });
    }

    setEditing(false);
  } catch {
    alert("Invalid JSON format.");
  }
};

  return (
    <Modal
title={
  <Group justify="space-between" align="center" style={{ width: "100%" }}>
    <Text fw={500}>Node Content</Text>
    {!editing ? (
      <Button size="xs" onClick={() => setEditing(true)}>
        Edit
      </Button>
    ) : (
      <Group gap="xs">
        <Button size="xs" color="green" onClick={handleSave}>
          Save
        </Button>
        <Button size="xs" color="red" variant="light" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </Group>
    )}
  </Group>
}
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
    >
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>Content</Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {editing ? (
              <Textarea
                value={editedValue}
                onChange={(e) => setEditedValue(e.currentTarget.value)}
                minRows={6}
                autosize
              />
            ) : (
              <CodeHighlight code={initialText} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
        </Stack>

        <Text fz="xs" fw={500}>JSON Path</Text>
        <ScrollArea.Autosize mah={250} maw={600}>
          <CodeHighlight code={path} miw={350} language="json" withCopyButton />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
