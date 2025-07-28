import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Group, Textarea } from "@mantine/core";
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

  const [isEditing, setIsEditing] = React.useState(false);
  const[editvalue, setEditValue] = React.useState<string>(nodeData);
  
  const contentsData = useFile(state => state.contents);
  const setContentData = useFile(state => state.setContents);

  React.useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData]);

  const SaveAction =() =>{
    const nodeSelected = path.split(".")[path.split(".").length - 1];
    const objData = JSON.parse(contentsData);
    objData[nodeSelected] = JSON.parse(editvalue);
    const newContent = JSON.stringify(objData, null, 2);
    setContentData({contents:newContent});
    setIsEditing(false);
    onClose();
    //alert(nodeSelected);
  };

  const CancelAction = () => {
    setIsEditing(false);
   setEditValue(nodeData);
  };

  const EditAction = () => {
    alert("Edit Action Triggered");
  };

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>    
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Group>
          <Text fz="xs" fw={500}>
            Content 
          </Text>
          {isEditing ? (
            <Group>
              <Button mt="md" color="green" onClick={SaveAction}>Save</Button>
              <Button mt="md" color="red" onClick={CancelAction}>Cancel</Button>
            </Group>
              ) : (
            <Button mt="md" color="blue" onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </Group>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Textarea
                value={editvalue}
                onChange={(e) => setEditValue(e.target.value)}
                autosize/>
            ):(
               <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            )}
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
