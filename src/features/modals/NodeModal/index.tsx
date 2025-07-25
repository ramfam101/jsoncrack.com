import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Textarea, Button, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { toast } from "react-hot-toast";
import useFile from "../../../store/useFile";
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
  const selectedNode = useGraph(state => state.selectedNode);
  const nodeData = dataToString(selectedNode?.text);
  const path = selectedNode?.path || "";

  const [editMode, setEditMode] = React.useState(false);
  const [value, setValue] = React.useState(nodeData);

  // Reset the modal state whenever it is opened with a new node
  React.useEffect(() => {
    if (opened) {
      setEditMode(false);
      setValue(nodeData);
    }
  }, [opened, nodeData]);

  const updateJsonAtPath = React.useCallback((jsonStr: string, pathStr: string, newVal: unknown) => {
    try {
      const jsonObj = JSON.parse(jsonStr);

      // Remove leading root identifiers
      let cleanPath = pathStr.replace(/^\{Root\}\.?/, "");
      cleanPath = cleanPath.replace(/^Root\[\d+\]\.?/, "");

      if (cleanPath === "") {
        // Replace whole document
        return JSON.stringify(newVal, null, 2);
      }

      const segments: (string | number)[] = [];
      const regex = /([^\.\[\]]+)|(\[(\d+)\])/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(cleanPath))) {
        if (match[1]) {
          segments.push(match[1]);
        }
        if (match[3]) {
          segments.push(Number(match[3]));
        }
      }

      let current: any = jsonObj;
      for (let i = 0; i < segments.length - 1; i++) {
        const key = segments[i];
        if (current[key] === undefined) {
          // Create missing structure (object)
          current[key] = typeof segments[i + 1] === "number" ? [] : {};
        }
        current = current[key];
      }

      const lastKey = segments[segments.length - 1];
      current[lastKey] = newVal;

      return JSON.stringify(jsonObj, null, 2);
    } catch (err) {
      console.error(err);
      return jsonStr;
    }
  }, []);

  const handleSave = () => {
    try {
      const parsedValue = JSON.parse(value);
      const fileStore = useFile.getState();
      const jsonStore = useJson.getState();

      const updatedJson = updateJsonAtPath(jsonStore.json, path, parsedValue);

      // Update editors and graph immediately
      fileStore.setContents({ contents: updatedJson, hasChanges: true, skipUpdate: false });
      jsonStore.setJson(updatedJson);

      toast.success("Node updated successfully");
      setEditMode(false);
      onClose?.();
    } catch (e) {
      toast.error("Invalid JSON content");
    }
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            {!editMode && (
              <Button size="xs" variant="light" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            )}
          </Group>

          {editMode ? (
            <Textarea
              value={value}
              onChange={e => setValue(e.currentTarget.value)}
              autosize
              minRows={6}
              maxRows={15}
              maw={600}
              miw={350}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          )}
        </Stack>

        {editMode ? (
          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" color="gray" size="xs" onClick={() => {
              setEditMode(false);
              setValue(nodeData);
            }}>
              Cancel
            </Button>
            <Button size="xs" onClick={handleSave}>
              Save
            </Button>
          </Group>
        ) : (
          <>
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
          </>
        )}
      </Stack>
    </Modal>
  );
};
