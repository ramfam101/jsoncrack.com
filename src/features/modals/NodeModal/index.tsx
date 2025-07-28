import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
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

  //manipulate controls
  const [textValue, setTextValue] = React.useState(nodeData);
  const [isEditEnabled, enableEdit] = React.useState(false);

  // edit json
  const contents = useFile(state => state.contents);
  const setContents = useFile(state => state.setContents);

  React.useEffect(()=>{setTextValue(nodeData);},[nodeData]);

  //Added buttons
  const Edit_Button = () => {enableEdit(true);};
  const Save_Button = () => {
    const nodeSelected = path.split(".")[path.split(".").length-1];
    const originalJson = JSON.parse(contents);
    originalJson[nodeSelected] = JSON.parse(textValue);
    setContents({contents:JSON.stringify(originalJson,null,2)});
    enableEdit(false);
    onClose();
  };
  const Cancel_Button = () => {
    enableEdit(false);
    setTextValue(nodeData);
  };
  //The display of the website
  return (
    <Modal title="Node Content " size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {
            isEditEnabled == false ? (<><Button onClick={Edit_Button}>Edit</Button><ScrollArea.Autosize mah={250} maw={600}>
                <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton/>
              </ScrollArea.Autosize></>):(<><Button onClick={Save_Button} color={"green"}>Save</Button>
              <Button onClick={Cancel_Button} color={"red"}>Cancel</Button>
              <Textarea value={textValue} onChange={(e)=> setTextValue(e.target.value)}/></>)
          }
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
