import React from "react";
import type { ModalProps } from "@mantine/core";
// import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button} from "@mantine/core";
import Editor, { type EditorProps, loader, type OnMount, useMonaco } from "@monaco-editor/react";

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

/*
TODO:

Possible implementation 1:

<ScrollArea.Autosize mah={250} maw={600}>
  if the user does not want to edit then <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
  if the user wants to edit then something else, maybe a similar thing to the live code editor??
</ScrollArea.Autosize>
*/

/*
Progress made in the hour:
- Located (it seems) the files for the node functionality
- Added an edit button in generally the same place as the example demonstration in the canvas video
- Started implementation for the edit functionality when the user chooses to edit the node
*/

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Stack gap="xs" style={{ flexDirection: "row" }}>
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Button size="xs" variant="light" style={{ marginLeft: "auto", marginTop: -8 }} onClick={() => alert("Button clicked!")}>Edit</Button>
          </Stack>
          <ScrollArea.Autosize mah={250} maw={600}>
            <Editor />
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
      </Stack>
    </Modal>
  );
};
