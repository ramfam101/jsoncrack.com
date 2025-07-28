// NodeModal.tsx

import React from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Button,
  Textarea,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

// Pretty-print raw data to JSON string
function dataToString(data: any): string {
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return "";
  }
}

export const NodeModal: React.FC<ModalProps> = ({ opened, onClose }) => {
  const selectedNode = useGraph((s) => s.selectedNode);
  const rawText = selectedNode?.text ?? {};
  const displayText = dataToString(rawText);
  const path = selectedNode?.path ?? "";

  const setSelectedNode = useGraph((s) => s.setSelectedNode);
  const setContents = useFile((s) => s.setContents);
  const fullText = useFile((s) => s.contents);

  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(displayText);
  React.useEffect(() => {
    setEditValue(displayText);
  }, [displayText, opened]);

  // Attempt a generic nested update
  function updateAtPath(obj: any, pathStr: string, newValue: any) {
    const clean = pathStr.replace(/^\{Root\}\.?/, "");
    const segments: (string | number)[] = [];
    clean.replace(/\[(\d+)\]|([^\.\[\]]+)/g, (_, idx, prop) => {
      if (prop) segments.push(prop);
      if (idx) segments.push(Number(idx));
      return "";
    });
    if (!segments.length) return false;
    let cur: any = obj;
    for (let i = 0; i < segments.length - 1; i++) {
      cur = cur?.[segments[i] as any];
      if (cur == null) return false;
    }
    const last = segments[segments.length - 1];
    cur[last as any] = newValue;
    return true;
  }

  const handleSave = () => {
    let updatedNode: any;
    // 1) Parse the edited JSON
    try {
      updatedNode = JSON.parse(editValue);
      // Convert an entries-list back to object if needed
      if (
        Array.isArray(updatedNode) &&
        updatedNode.every((i: any) => Array.isArray(i) && i.length === 2)
      ) {
        updatedNode = Object.fromEntries(updatedNode);
      }
    } catch (e) {
      console.error("Invalid JSON in editor:", e);
      return;
    }

    // 2) Update the full JSON
    try {
      const fullObj = JSON.parse(fullText || "{}");
      let replaced = false;

      // A) Try path-based replacement (fruits[<n>])
      const match = path.match(/fruits\[(\d+)\]/);
      if (match && Array.isArray(fullObj.fruits)) {
        const idx = parseInt(match[1], 10);
        if (idx >= 0 && idx < fullObj.fruits.length) {
          fullObj.fruits[idx] = updatedNode;
          replaced = true;
        }
      }

      // B) If path didn’t hit, try matching by rawText inside fruits[]
      if (!replaced && Array.isArray(fullObj.fruits)) {
        const idx = fullObj.fruits.findIndex((item: any) =>
          JSON.stringify(item) === JSON.stringify(rawText)
        );
        if (idx !== -1) {
          fullObj.fruits[idx] = updatedNode;
          replaced = true;
        }
      }

      // C) Fallback to generic path
      if (!replaced) {
        replaced = updateAtPath(fullObj, path, updatedNode);
      }

      // D) Last resort: merge at root
      if (!replaced) {
        Object.assign(fullObj, updatedNode);
      }

      const newFull = JSON.stringify(fullObj, null, 2);
      setContents({ contents: newFull });
    } catch (e) {
      console.error("Failed to update main JSON:", e);
      // Overwrite entire file if something went very wrong
      setContents({ contents: editValue });
    }

    // 3) Update the graph store
    if (selectedNode) {
      setSelectedNode({ ...selectedNode, text: updatedNode });
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(displayText);
    setIsEditing(false);
  };

  return (
    <Modal
      title="Node Content"
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
    >
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.currentTarget.value)}
                autosize
                minRows={6}
                maw={600}
                miw={350}
                styles={{ input: { fontFamily: "monospace" } }}
              />
            ) : (
              <CodeHighlight
                code={displayText}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            {isEditing ? (
              <>
                <Button size="xs" variant="filled" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit JSON
              </Button>
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
            copyLabel="Copy"
            copiedLabel="Copied!"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};

export default NodeModal;
