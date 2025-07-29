import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
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

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);        //WILL CONTINUE WITH THESE TWO FUNCTIONS IN NEXT PULL REQUEST
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");
  const setNodeData = useGraph(state => state.setNodeData); // Need to implement this in your store, CONTINUE IN NEXT PULL REQUEST


  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData);

  React.useEffect(() => {
    setEditValue(nodeData);
  }, [nodeData, opened]);


  const handleSave = () => {
    //May want to parse and validate JSON here
    try{
      const parsed = JSON.parse(editValue);
      if (selectedNode){
        setNodeData(selectedNode.id, parsed);
        setIsEditing(false);
      } else {
        alert("No node selected");
      }
    } catch(e) {
      alert("Invalid JSON format");
    }
  }





  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
    


          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <textarea
                style={{ width: "100%", minHeight: "150px", fontSize: "15px" }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                />
            ) : (
              <CodeHighlight
                code={nodeData}
                miw={350}
                mah={250}
                language="json"
                withCopyButton
                />
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

       
       {isEditing ? (
          <Stack gap="xs">
            <button
              style={{ width: "80px", height: "32px", fontSize: "15px", cursor: "pointer" }}
              onClick={handleSave}
            >
              Save
            </button>
            <button
              style={{ width: "80px", height: "32px", fontSize: "15px", cursor: "pointer" }}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </Stack>
        ) : (
          <button
            style={{
              width: "80px",
              height: "32px",
              fontSize: "15px",
              alignSelf: "flex-end",
              cursor: "pointer",
            }}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}
      </Stack>
    </Modal>
  );
};
