import React, { useEffect, useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { FaLastfmSquare } from "react-icons/fa";
import { Content } from "next/font/google";
import { NodeNextRequest } from "next/dist/server/base-http/node";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

function json_viewer(nodeData, setEditting) {
  return (
    <div id="json">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Text fz="xs" fw={500}>
          Content
        </Text>
        <button style={{
          border: "2px solid #464646ff",
          borderRadius: "6px",
          background: "#464646ff",
          transition: "background 0.2s"
        }} onClick={() => setEditting(true)}>
          <Text fz="xs" fw={500}>
            Edit
          </Text>
        </button>
      </div>
      <ScrollArea.Autosize mah={250} maw={600}>
        <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
      </ScrollArea.Autosize>
    </div >
  );
}

function json_editor(tempNodeData, setTempNodeData, setEditting, updateSelectedNode, nodeData, error, setError) {
  function showError() {
    if (error) {
      return (
        <Text style={{ color: "red" }} fz="xs" fw={500}>
          Invalid JSON
        </Text>
      );
    }
  }

  return (
    <div id="json">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Text fz="xs" fw={500}>
          Content
        </Text>
        <div style={{ display: "flex", alignItems: "center" }}>
          {showError()}
          <button style={{
            color: "black",
            border: "2px solid #68cf68ff",
            borderRadius: "6px",
            background: "#68cf68ff",
            transition: "background 0.2s"
          }} onClick={() => {
            try {
              const newjson = JSON.parse(tempNodeData);
              updateSelectedNode(newjson);
              setTempNodeData(JSON.stringify(newjson, null, 2));
              setError(false);
              setEditting(false);
            } catch {
              setError(true);
            }
          }}>
            <Text fz="xs" fw={500}>
              Save
            </Text>
          </button>
          <button style={{
            border: "2px solid #464646ff",
            borderRadius: "6px",
            background: "#464646ff",
            transition: "background 0.2s"
          }} onClick={() => { setTempNodeData(nodeData); setError(false); setEditting(false); }}>
            <Text fz="xs" fw={500}>
              Cancel
            </Text>
          </button>
        </div>
      </div>
      <Textarea autosize readOnly={false} value={tempNodeData} onChange={e => setTempNodeData(e.target.value)} style={{ minWidth: 350, maxWidth: 600, maxHeight: 250 }} />
    </div>
  );
}

function closeThingy(setEditting, setError, onClose) {
  setEditting(false);
  setError(false);
  onClose();
}

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const updateNode = useGraph(state => state.updateSelectedNodeText);
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const [tempNodeData, setTempNodeData] = useState(nodeData);
  const path = useGraph(state => state.selectedNode?.path || "");
  const [error, setError] = useState(false);
  var [editting, setEditting] = useState(false);

  useEffect(() => {
    if (nodeData) {
      setTempNodeData(nodeData);
      setError(false);
    }
  }, [nodeData]);

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={() => closeThingy(setEditting, setError, onClose)} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          {editting ? json_editor(tempNodeData, setTempNodeData, setEditting, updateNode, nodeData, error, setError) : json_viewer(nodeData, setEditting)}
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
