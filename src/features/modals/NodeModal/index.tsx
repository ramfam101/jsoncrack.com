import React, { useEffect, useState } from "react";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { ModalProps } from "@mantine/core";

import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

function serializeContent(content: any): string {
  const source = Array.isArray(content) ? Object.fromEntries(content) : content;
  return JSON.stringify(source, null, 2);
}

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const node = useGraph(state => state.selectedNode);
  const updateNode = useGraph(state => state.updateNode);
  const setNode = useGraph(state => state.setSelectedNode);

  const jsonText = useFile(state => state.contents);
  const updateJsonText = useFile(state => state.setContents);

  const path = node?.path || "";
  const defaultText = serializeContent(node?.text ?? {});
  const [editMode, setEditMode] = useState(false);
  const [input, setInput] = useState(defaultText);

  useEffect(() => {
    setInput(defaultText);
    setEditMode(false);
  }, [defaultText, opened]);

  const updateJsonByPath = (obj: any, pathStr: string, value: any) => {
    const keys = pathStr.replace("{Root}.", "").split(".");
    let target = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (target[keys[i]] === undefined) target[keys[i]] = {};
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;
  };

  const onSave = () => {
    try {
      const parsed = JSON.parse(input);
      updateNode?.(node.id, parsed);

      const json = JSON.parse(jsonText);
      updateJsonByPath(json, path, parsed);
      updateJsonText({ contents: JSON.stringify(json, null, 2) });

      setEditMode(false);
    } catch (error) {
      alert("Error: Invalid JSON input.");
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Node Editor" size="auto" centered>
      <Stack spacing="md">
        <div>
          <Text size="sm" weight={500}>Content</Text>
          <ScrollArea.Autosize maxHeight={300}>
            {editMode ? (
              <Textarea
                value={input}
                onChange={e => setInput(e.currentTarget.value)}
                autosize
                minRows={6}
                maxRows={12}
                styles={{ input: { fontFamily: "monospace" } }}
              />
            ) : (
              <CodeHighlight code={defaultText} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
        </div>

        <div>
          <Text size="sm" weight={500}>Path</Text>
          <ScrollArea.Autosize maxHeight={100}>
            <CodeHighlight code={path} language="json" withCopyButton />
          </ScrollArea.Autosize>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {!editMode ? (
            <Button color="blue" variant="light" onClick={() => setEditMode(true)}>Edit</Button>
          ) : (
            <>
              <Button color="green" onClick={onSave}>Save</Button>
              <Button color="gray" onClick={() => {
                setInput(defaultText);
                setEditMode(false);
              }}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </Stack>
    </Modal>
  );
};
