// src/features/modals/NodeModal/index.tsx
import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";

import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile  from "../../../store/useFile";

const toStr = (d: any) => JSON.stringify(d, null, 2);

/* ---------- helpers ---------- */
// "{Root}.fruit.0.name"  ->  ["fruit", 0, "name"]
const pathToArr = (p: string | (string | number)[]) =>
  Array.isArray(p)
    ? p
    : p
        .replace(/^\{Root\}\./, "")
        .split(".")
        .filter(Boolean)
        .map(seg => (String(+seg) === seg ? +seg : seg));

// immutably patch a nested value in object/array
const patch = (obj: any, path: (string | number)[], val: any): any => {
  if (!path.length) return val;
  const [h, ...rest] = path;
  if (Array.isArray(obj)) {
    const a = [...obj];
    a[h as number] = patch(obj[h as number], rest, val);
    return a;
  }
  return { ...obj, [h]: patch(obj[h], rest, val) };
};
/* -------------------------------- */

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const node = useGraph(s => s.selectedNode);

  /* ---------- derive value to display ---------- */
  const raw = node?.text;
  const isEntryArray =
    Array.isArray(raw) &&
    raw.every(e => Array.isArray(e) && e.length === 2 && typeof e[0] === "string");

  const objForEditor = isEntryArray ? Object.fromEntries(raw!) : raw;
  const nodeData     = toStr(objForEditor);

  /* ---------- path ---------- */
  const pathArr = pathToArr(node?.path || []);

  /* ---------- local state ---------- */
  const [editing, setEditing] = useState(false);
  const [editValue, setValue] = useState(nodeData);

  useEffect(() => {
    setValue(nodeData);
    setEditing(false);
  }, [nodeData]);

  /* ---------- save ---------- */
  const handleSave = () => {
    let parsed: any;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      alert('Invalid JSON. Please enter valid JSON, e.g. { "name": "orange" }');
      return;
    }

    /* graph needs the entry‑array form */
    const graphVal =
      isEntryArray && typeof parsed === "object" && !Array.isArray(parsed)
        ? Object.entries(parsed)
        : parsed;

    /* editor needs the object form */
    const editorVal =
      isEntryArray && Array.isArray(graphVal)
        ? Object.fromEntries(graphVal)
        : parsed;

    /* 1) update graph */
    useGraph.getState().updateNode(node!.id, graphVal);

    /* 2) update left‑hand editor */
    const { contents, setContents } = useFile.getState();
    try {
      const fullObj = JSON.parse(contents);
      const patched = patch(fullObj, pathArr, editorVal);
      setContents({
        contents: JSON.stringify(patched, null, 2),
        skipUpdate: false,
      });
    } catch (err) {
      console.error("Could not sync editor JSON:", err);
    }

    setEditing(false);
    onClose();
  };

  const handleCancel = () => {
    setValue(nodeData);
    setEditing(false);
  };

  if (!node) return null;

  /* ---------- render ---------- */
  return (
    <Modal title="Node Content" opened={opened} onClose={onClose} centered size="auto">
      <Stack py="sm" gap="sm">
        <Group justify="space-between" mb="xs">
          <Text fz="xs" fw={500}>Content</Text>
          {!editing && <Button size="xs" onClick={() => setEditing(true)}>Edit</Button>}
        </Group>

        <ScrollArea.Autosize mah={250} maw={600}>
          {editing ? (
            <>
              <textarea
                style={{ width: "100%", minHeight: 120, fontFamily: "monospace" }}
                value={editValue}
                onChange={e => setValue(e.target.value)}
              />
              <Group mt="xs">
                <Button color="green" onClick={handleSave}>Save</Button>
                <Button variant="default" onClick={handleCancel}>Cancel</Button>
              </Group>
            </>
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

        <Text fz="xs" fw={500}>JSON Path</Text>
        <ScrollArea.Autosize mah={250} maw={600}>
          <CodeHighlight
            code={JSON.stringify(pathArr)}
            miw={350}
            language="json"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};

export default NodeModal;
