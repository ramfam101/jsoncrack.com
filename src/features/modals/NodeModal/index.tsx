import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Group, Stack, Text, ScrollArea, Textarea, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";
import useJson from "../../../store/useJson";
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
  const ogNodeData = useGraph(s => s.selectedNode?.text ?? "");
  const path = useGraph(s => s.selectedNode?.path ?? "");
  const jsonStr = useJson(s => s.json);
  const setJson = useJson(s => s.setJson);
  const setGraph = useGraph(s => s.setGraph);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftNode, setDraftNode] = useState<string>(dataToString(ogNodeData));

  useEffect(() => {
    setDraftNode(dataToString(ogNodeData));
    setIsEditing(false);
  }, [ogNodeData, opened]);

  const handleSave = (): void => {
    let parsed: any;
    try {
      parsed = JSON.parse(draftNode);
    } catch {
      alert("Invalid JSON");
      return;
    }

    const cleanPath = path.replace(/^\{Root\}\./, "");
    const jsonObj = JSON.parse(jsonStr);
    const updatedjsonObj = cloneDeep(jsonObj);
    set(updatedjsonObj, cleanPath, parsed);
    const updatedJsonStr = dataToString(updatedjsonObj);
    setJson(updatedJsonStr);
    setGraph(updatedJsonStr);
    onClose();
  };

  const Header = (
    <Group position="apart" noWrap sx={{ width: "100%" }}>
      <Text fw={500}>Node Content</Text>
      {isEditing ? (
        <Group spacing="xs">
          <Button size="xs" variant="outline" color="gray" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button size="xs" color="green" onClick={handleSave}>
            Save
          </Button>
        </Group>
      ) : (
        <Button size="xs" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      )}
    </Group>
  );

  return (
    <Modal
      title={Header}
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={!isEditing}
    >
      <Stack py="sm" gap="sm">
        {/* Content Area */}
        <Text fz="xs" fw={500}>
          Content
        </Text>
        {isEditing ? (
          <Textarea
            minRows={8}
            maxRows={20}
            value={draftNode}
            onChange={e => setDraftNode(e.currentTarget.value)}
            styles={{ input: { fontFamily: "monospace", fontSize: 14 } }}
          />
        ) : (
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight
              code={dataToString(ogNodeData)}
              language="json"
              miw={350}
              maw={600}
              withCopyButton
            />
          </ScrollArea.Autosize>
        )}

        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize mah={100} maw={600}>
          <Text fz="sm" ff="monospace">
            {path}
          </Text>
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
