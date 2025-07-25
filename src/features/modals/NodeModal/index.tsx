import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJsonQuery from "../../../hooks/useJsonQuery";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Button variant="outline" onClick={() => setIsEditing(true)} size="xs" style={{ alignSelf: "flex-end" }}>
          Edit
        </Button>
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
        {isEditing && (
          <Modal
            title="Edit Node Content"
            size="auto"
            opened={isEditing}
            onClose={() => setIsEditing(false)}
            centered
          >
            <Stack py="sm" gap="sm">
              <Text fz="xs" fw={500}>
                Edit the content of the node below:
              </Text>
              <CodeHighlight
                code={nodeData}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
                contentEditable
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              />
              <Button variant="outline" 
              onClick={(e) => {
                const newContent = e.currentTarget.textContent || ""; 
                useJsonQuery().updateJson(newContent);
              }} size="xs" style={{ alignSelf: "flex-end" }}>
              Save Changes
              </Button>
            </Stack>
            <Button variant="outline" onClick={() => setIsEditing(false)} size="xs" style={{ alignSelf: "flex-end" }}>
              Cancel  
            </Button>
          </Modal>
        )}
      </Stack>
    </Modal>
  );
};
