import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
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
  
  const setNodeData = useFile(state => state.setContents);
  //const setContents = useFile(state => state.setContents);

//   function setNodeDataFromJson(newContent: string) {
//   try {
//     const parsed = JSON.parse(newContent);
//     setNodeData({ contents: parsed });
//   } catch (e) {
//     alert("Invalid JSON format.");
//   }
// }

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <button
            id="edit"
            onClick={() => {
              document.getElementById("code")?.setAttribute("contentEditable", "true");
              document.getElementById("save")?.removeAttribute("hidden");
              document.getElementById("cancel")?.removeAttribute("hidden");
              document.getElementById("edit")?.setAttribute("hidden", "true");
            }}
          >
            edit
          </button>
          <button id="save" hidden onClick={() => {
              document.getElementById("code")?.setAttribute("contentEditable", "false");
              document.getElementById("save")?.setAttribute("hidden", "true");
              document.getElementById("cancel")?.setAttribute("hidden", "true");
              document.getElementById("edit")?.removeAttribute("hidden");

              // const code = document.getElementById("code")?.textContent ?? "";
              // setNodeDataFromJson(code);;

            }}>save</button>
          <button id="cancel" hidden onClick={() => {
              document.getElementById("code")?.setAttribute("contentEditable", "false");
              document.getElementById("save")?.setAttribute("hidden", "true");
              document.getElementById("cancel")?.setAttribute("hidden", "true");
              document.getElementById("edit")?.removeAttribute("hidden");
            }}>cancel</button>
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight id="code" code={nodeData} miw={350} maw={600} language="json" withCopyButton/>
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
