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
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");

  /* ------------------------------------------------------------------ */
  /* local edit state -------------------------------------------------- */
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedText, setEditedText] = React.useState(nodeData);

  // keep local buffer in-sync when a different node is selected
  React.useEffect(() => {
    setEditedText(nodeData);
    setIsEditing(false);
  }, [nodeData]);

  /* helper: update json string at path -------------------------------- */
  const updateJsonAtPath = React.useCallback(
    (jsonStr: string, jsonPath: string, newValue: any) => {
      // remove leading "{Root}." or "{Root}"
      const cleaned = jsonPath.replace(/^\{Root\}\.?/, "");
      const segments: (string | number)[] = [];
      const re = /([^.\\[\\]]+)|\\[(\\d+)\\]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(cleaned))) {
        segments.push(m[1] ?? Number(m[2]));
      }

      const srcObj = JSON.parse(jsonStr);
      let cur: any = srcObj;
      for (let i = 0; i < segments.length - 1; i++) {
        const key = segments[i];
        if (!(key in cur)) cur[key] = typeof segments[i + 1] === "number" ? [] : {};
        cur = cur[key];
      }
      cur[segments[segments.length - 1]] = newValue;
      return JSON.stringify(srcObj, null, 2);
    },
    []
  );

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedText);
      const jsonStore = useJson.getState();
      const freshJson = updateJsonAtPath(jsonStore.getJson(), path, parsed);
      jsonStore.setJson(freshJson); // triggers graph re-render

      setIsEditing(false);
      onClose?.(); // close modal
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Invalid JSON – please fix syntax before saving.");
      // keep editing so user can fix it
    }
  };
  /* ------------------------------------------------------------------ */

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing ? (
            <Textarea
              autosize
              minRows={8}
              spellCheck={false}
              value={editedText}
              onChange={e => setEditedText(e.currentTarget.value)}
              styles={{ input: { fontFamily: "monospace" } }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
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

        {/* action area */}
        <Group justify="flex-end" gap="xs">
          {isEditing ? (
            <>
              <Button variant="default" size="xs" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="xs" onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="xs"
              data-testid="edit-node-button"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};
