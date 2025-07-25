import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { Button, Group } from "@mantine/core";
import useFile from "../../../store/useFile";

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
  const setContents = useFile(state => state.setContents);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(nodeData);

  return (
    <Modal
    title="Node Content"
    size="auto"
    opened={opened} 
    onClose={() => { setIsEditing(false);
     onClose();
     }}
      centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Button size="xs" variant="outline" onClick={() => {setIsEditing(true)}}> 
              Edit
            </Button>
          </Group>
          {isEditing ? ( // Editable view
              <>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  style={{ width: "100%", height: "200px" }}
                />
                <Group mt="xs">
                  <Button
                    size="xs"
                    color="green"
                    onClick={() => {
                      setContents({ contents: editValue });
                      setIsEditing(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    color="red"
                    onClick={() => {
                      setEditValue(nodeData);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Group>
              </>

          ) : ( // Read-only view
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
      </Stack>
    </Modal>
  );
};
