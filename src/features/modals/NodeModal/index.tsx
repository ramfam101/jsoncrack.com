import React from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Button,
  Group,
  Textarea,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import toast from "react-hot-toast";

import JSON5 from "json5";

import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile  from "../../../store/useFile";
import useJson  from "../../../store/useJson";
import { updateJsonAtPath } from "../../../lib/utils/jsonPathUtils";

/* ------------ helpers ------------------------------------------- */

const dataToString = (data: any) =>
  Array.isArray(data) && data.length && Array.isArray(data[0])
    ? JSON.stringify(Object.fromEntries(data), null, 2)
    : JSON.stringify(data, null, 2);

/* ------------ component ----------------------------------------- */

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph((s) => s.selectedNode);

  const setContents = useFile((s) => s.setContents);
  const getJson     = useJson((s) => s.getJson);
  const setJson     = useJson((s) => s.setJson);

  const [isEditing,       setIsEditing]       = React.useState(false);
  const [editedContent,   setEditedContent]   = React.useState("");
  const [originalContent, setOriginalContent] = React.useState("");

  const path     = selectedNode?.path ?? "";
  const nodeData = dataToString(selectedNode?.text);

  /* reset on new node ------------------------------------------- */
  React.useEffect(() => {
    if (selectedNode) {
      const content = dataToString(selectedNode.text);
      setOriginalContent(content);
      setEditedContent(content);
      setIsEditing(false);
    }
  }, [selectedNode]);

  /* -------- handlers ------------------------------------------- */

  const handleEdit = () => setIsEditing(true);

  const handleSave = () => {
  try {
    /* ── ① parse the edited snippet ─────────────────────────── */
    let newVal;
    try {
      newVal = JSON5.parse(editedContent);
    } catch (e) {
      console.error("Snippet JSON parse failed:", e);
      toast.error("The text in the modal is not valid JSON.");
      return;
    }

    /* ── ② parse the entire document from the left editor ───── */
    let currentJson;
    try {
      currentJson = JSON5.parse(getJson());
    } catch (e) {
      console.error("Left-editor JSON parse failed:", e);
      toast.error("The JSON in the left editor is broken. Fix it first.");
      return;
    }

    /* ── ③ update at path ───────────────────────────────────── */
    if (!updateJsonAtPath(currentJson, path, newVal)) {
      toast.error("Failed to update node (bad path?)");
      return;
    }

    /* ── ④ persist & finish ─────────────────────────────────── */
    const pretty = JSON.stringify(currentJson, null, 2);
    setJson(pretty);
    setContents({ contents: pretty });

    setIsEditing(false);
    setOriginalContent(editedContent);
    toast.success("Node updated successfully");
  } catch (unexpected) {
    console.error("Unexpected error in handleSave:", unexpected);
    toast.error("Unexpected error - see console");
  }
};


  const handleCancel = () => {
    setEditedContent(originalContent);
    setIsEditing(false);
  };

  /* -------- UI -------------------------------------------------- */
  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">

        {/* content ------------------------------------------------- */}
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>Content</Text>
            {!isEditing && (
              <Button size="xs" variant="light" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </Group>

          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.currentTarget.value)}
                minRows={6}
                maxRows={15}
                autosize
                styles={{ input: { fontFamily: "monospace", fontSize: 13 } }}
              />
            ) : (
              <CodeHighlight
                code={nodeData}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>

          {isEditing && (
            <Group justify="flex-end" mt="xs">
              <Button size="xs" variant="default" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="xs" color="green" onClick={handleSave}>
                Save
              </Button>
            </Group>
          )}
        </Stack>

        {/* path ---------------------------------------------------- */}
        <Stack gap="xs">
          <Text fz="xs" fw={500}>JSON Path</Text>
          <ScrollArea.Autosize maw={600}>
            <CodeHighlight
              code={path}
              miw={350}
              mah={250}
              language="json"
              withCopyButton
            />
          </ScrollArea.Autosize>
        </Stack>
      </Stack>
    </Modal>
  );
};
