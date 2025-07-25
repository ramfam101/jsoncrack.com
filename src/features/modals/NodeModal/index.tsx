import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { FaLastfmSquare } from "react-icons/fa";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

function json_viewer(nodeData, setEditting) {
  return (
    <div id="json">
      <button onClick={() => setEditting(true)}>Edit</button>
      <ScrollArea.Autosize mah={250} maw={600}>
        <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
      </ScrollArea.Autosize>
    </div>
  );
}

function json_editor(nodeData, setEditting) {
  return (
    <div id="json">
      <input type="text" value={nodeData} />
    </div>
  );
}

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  var [editting, setEditting] = useState(false);

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {editting ? json_editor(nodeData, setEditting) : json_viewer(nodeData, setEditting)}
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
      </Stack>
    </Modal>
  );
};
