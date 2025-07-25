import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import TextEditor from "../../editor/TextEditor"

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
  const nodeText = useGraph(state => state.selectedNode?.text || "");
  const path = useGraph(state => state.selectedNode?.path || "");
  const [editorOpened, setEditorOpened] = React.useState(false);

  return (
    <>
    <Modal 
       title={
            <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <div style={{ flex: 1, mindWidth: 0, whiteSpace: "nowrap" }}>Node Content Thing</div>
            <Button variant="filled" color="green" aria-label="Edit" onClick={() => { setEditorOpened(true); console.log(nodeData); }} style={{
                position: "absolute", right: 50
            }}>
                <Text> Edit </Text>
            </Button>
            </div>
        }
    size="auto" opened={opened} onClose={onClose} centered>
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
      </Stack>
    </Modal>

    <Modal
        opened={editorOpened}
        onClose={() => setEditorOpened(false)}
        size = "lg"
        centered
        title="Edit Content"
    >
        <TextEditor intialValue={nodeText} />
    </Modal>
    </>
  );
};
