import React, { useEffect, useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group, TextInput } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import get from "lodash/get";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import { IconPencil } from "@tabler/icons-react";

const dataToString = (data: any) => {
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean" || data === null) return String(data);
  return JSON.stringify(data, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const node = useGraph(state => state.selectedNode);
  const { json, updateNode } = useJson(state => ({ json: state.json, updateNode: state.updateNode }));

  const [currentNodeContent, setCurrentNodeContent] = useState<any>(null);
  const [editedNodeData, setEditedNodeData] = useState("");

  useEffect(() => {
    if (node && json) {
      try {
        const fullJson = JSON.parse(json);
        let path = node.path || "";

        if (path === "{Root}") {
          path = "";
        } else if (path.startsWith("{Root}.")) {
          path = path.substring("{Root}.".length);
        }

        const nodeValue = path ? get(fullJson, path) : fullJson;
        setCurrentNodeContent(nodeValue);
        setEditedNodeData(dataToString(nodeValue));
      } catch (e) {
        console.error("Error parsing JSON or finding node data", e);
        // Fallback or error state
        setCurrentNodeContent("Error: Invalid JSON");
        setEditedNodeData("Error: Invalid JSON");
      }
    }
  }, [node, json]);

  const isObject = typeof currentNodeContent === "object" && currentNodeContent !== null;

  const handleSave = () => {
    try {
      let valueToSave;
      if (isObject) {
        valueToSave = JSON.parse(editedNodeData);
      } else {
        // Attempt to parse as a number, otherwise keep as string
        const parsedNumber = Number(editedNodeData);
        valueToSave =
          !isNaN(parsedNumber) && editedNodeData.trim() !== "" ? parsedNumber : editedNodeData;
      }

      if (node && typeof node.path === "string") {
        updateNode(node.path, valueToSave);
        setIsEditing(false);
        onClose();
      } else {
        console.error("Node or node.path is invalid");
      }
    } catch (e) {
      console.error("Error parsing edited JSON", e);
      // Optionally, show an error to the user in the UI
    }
  };

  const title = (
    <Group justify="space-between" style={{ width: "100%" }}>
      <Text>Node Content</Text>
      {!isEditing && (
        <Button
          size="xs"
          variant="subtle"
          onClick={() => setIsEditing(true)}
          leftSection={<IconPencil size={14} />}
        >
          Edit
        </Button>
      )}
    </Group>
  );

  const renderEditState = () => {
    // Use Textarea for objects and arrays, TextInput for everything else
    if (isObject) {
      return (
        <Textarea
          value={editedNodeData}
          onChange={event => setEditedNodeData(event.currentTarget.value)}
          autosize
          minRows={2}
          maxRows={10}
        />
      );
    }
    return (
      <TextInput
        value={editedNodeData}
        onChange={event => setEditedNodeData(event.currentTarget.value)}
      />
    );
  };

  return (
    <Modal
      title={title}
      size="auto"
      opened={opened}
      onClose={() => {
        setIsEditing(false);
        onClose();
      }}
      centered
    >
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing ? (
            <Stack>
              {renderEditState()}
              <Group justify="flex-end">
                <Button variant="default" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </Group>
            </Stack>
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={dataToString(currentNodeContent)}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          )}
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={node?.path || ""}
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
