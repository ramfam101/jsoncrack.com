import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

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

  // --- Big Green Button Handler ---
  const handleBigGreenClick = () => {
    // Add your logic here
    alert("Big Green Button clicked!");
  };
  // --- End Handler ---

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
          </ScrollArea.Autosize>
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
          {/* --- Big Green Button Start --- */}
        <Button
          onClick={handleBigGreenClick}
          size="lg"
          style={{
            background: "#22c55e",
            color: "#fff",
            fontWeight: "bold",
            border: "2px solid #16a34a",
            boxShadow: "0 0 8px #22c55e",
            fontSize: "1.2rem",
            padding: "0.75rem 2rem",
            marginTop: "1rem",
          }}
        >
          Big Green Button
        </Button>
        {/* --- Big Green Button End --- */}
      </Stack>
    </Modal>
  );
};

