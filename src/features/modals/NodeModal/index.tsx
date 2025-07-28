import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Group,
  Button,
  Textarea,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const rawNode = useGraph((state) => state.selectedNode?.text);
  const nodeObject = Array.isArray(rawNode)
    ? Object.fromEntries(rawNode)
    : rawNode ?? {};
  const path = useGraph((state) => state.selectedNode?.path || "");

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(() =>
    JSON.stringify(nodeObject, null, 2)
  );


  const getFormattedNodeText = () => {
    const updatedRawNode = useGraph.getState().selectedNode?.text;
    const updatedNodeObject = Array.isArray(updatedRawNode)
      ? Object.fromEntries(updatedRawNode)
      : updatedRawNode ?? {};
    return JSON.stringify(updatedNodeObject, null, 2);
  };

  const handleSave = () => {
  try {
    if (!editedText.trim()) {
      alert("Cannot save empty content");
      return;
    }
    const parsed = JSON.parse(editedText);

    useGraph.getState().updateNode(path, parsed);

    const updatedNode = useGraph.getState().nodes.find(
      (n) => n.data?.path === path
    );
    if (updatedNode) {
      useGraph.getState().setSelectedNode(updatedNode);
    }

    const jsonState = useJson.getState();
    const currentJson = JSON.parse(jsonState.getJson());
    const pathKeys = path.replace("{Root}.", "").split(".");
    let target = currentJson;
    for (let i = 0; i < pathKeys.length - 1; i++) {
      target = target[pathKeys[i]];
    }
    target[pathKeys[pathKeys.length - 1]] = parsed;
    const updatedString = JSON.stringify(currentJson, null, 2);
    jsonState.setJson(updatedString);
    useFile.getState().setContents({ contents: updatedString });
    console.log("Updated JSON sent to editor:", currentJson);
    setIsEditing(false);
  } catch (e) {
    console.error("JSON parse error:", e);
    alert("Invalid JSON");
  }
};
  React.useEffect(() => {
    if (opened) {
      setEditedText(getFormattedNodeText());
      setIsEditing(false);
    }
  }, [opened]);

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
                value={editedText}
                onChange={(e) => setEditedText(e.currentTarget.value)}
                autosize
                minRows={6}
                maxRows={12}
                miw={350}
                maw={600}
              />
            ) : (
              <CodeHighlight
                code={editedText}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
          <Group mt="xs">
            {isEditing ? (
              <>
                <Button color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button
                  color="red"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedText(getFormattedNodeText());
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </Group>
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
