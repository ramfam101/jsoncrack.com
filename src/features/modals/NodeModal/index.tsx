import React, {useRef} from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import TextEditor from "../../editor/TextEditor"
import useFile from "../../../store/useFile";
import useJson from "../../../store/useJson";

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
  const setGraph = useGraph(state => state.setGraph);
  const selectedNode = useGraph(state => state.selectedNode);
  const nodes = useGraph(state => state.nodes);
  const nodeText = useGraph(state => state.selectedNode?.text || "");
  const path = useGraph(state => state.selectedNode?.path || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editorOpened, setEditorOpened] = React.useState(false);
  const contents = useFile(state => state.contents);
  const setContents = useFile(state => state.setContents);

  const handleSave = () => {
    const value = textareaRef.current?.value ?? "";
    try {
      const json = JSON.parse(contents);
      
      // Split the path (e.g. "fruit.name" => ["fruit", "name"])
      const keys = path.split(".");
      keys.splice(0, 1);
      let obj = json;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in obj)) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = JSON.parse(value);
      
      useFile.getState().setContents({contents: JSON.stringify(obj, null, 2)});
      useJson.getState().setJson(JSON.stringify(obj, null, 2));

      setEditorOpened(false);
    } catch (e) {
      alert("Failed to update JSON: " + e);
    }
  };

  return (
    <>
    <Modal 
       title={
            <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <div style={{ flex: 1, mindWidth: 0, whiteSpace: "nowrap" }}>Node Content</div>
            <Button variant="filled" color="green" aria-label="Edit" onClick={() => { setEditorOpened(true) }} style={{
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
            <CodeHighlight code={dataToString(selectedNode?.text) || "oops"} miw={350} maw={600} language="json" withCopyButton />
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
         title={
            <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <div style={{ flex: 1, mindWidth: 0, whiteSpace: "nowrap" }}>Edit Content</div>
            <Button variant="filled" color="gray" aria-label="Cancel" onClick={() => { setEditorOpened(false); }} style={{
                position: "absolute", right: 150
            }}>
                <Text> Cancel </Text>
            </Button>

            <Button variant="filled" color="green" aria-label="Save" onClick={handleSave} style={{
                position: "absolute", right: 50
            }}>
                <Text> Save </Text>
            </Button>
            </div>
        }
    >
        <Textarea defaultValue={nodeData} minRows={6} autosize ref={textareaRef}/>
    </Modal>
    </>
  );
};
