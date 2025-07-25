import React, {useState} from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import { Modal, Button, Text, Textarea } from "@mantine/core";
import useFile from "../../../../../store/useFile";
import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage-instance";


type Value = [string, string];

type RowProps = {
  val: Value;
  x: number;
  y: number;
  index: number;
  onClick?: () => void;
};

const Row = ({ val, x, y, index, onClick}: RowProps) => {
  const key = JSON.stringify(val);
  const rowKey = JSON.stringify(val[0]).replaceAll('"', "");
  const rowValue = JSON.stringify(val[1]);

  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;

  return (
    <Styled.StyledRow
      $value={rowValue}
      data-key={key}
      data-x={x}
      data-y={y + rowPosition}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <Styled.StyledKey $type="object">{rowKey}: </Styled.StyledKey>
      <TextRenderer>{rowValue}</TextRenderer>
    </Styled.StyledRow>

  );
};

const Node = ({ node, x, y }: CustomNodeProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editPath, setEditPath] = useState<string | null>(null);
  const jsonString = useFile((state) => state.getContents());
  const setContents = useFile(state => state.setContents);
  function getNodeJson(path: string){
    try{
      const json = JSON.parse(jsonString);
      return path.split(".").reduce((acc, key) => acc?.[key], json);
    }
    catch{
      return null;
    }
  }
  function handleRowClick(key: string){
    setEditPath(key);
    const nodeJson = getNodeJson(key);
    setEditContent(JSON.stringify(nodeJson, null, 2));
    setModalOpen(true);
  }
  function handleSave() {
    try{
      const json = JSON.parse(jsonString);
      if (editPath) {
        json[editPath] = JSON.parse(editContent);
        setContents({contents: JSON.stringify(json, null, 2)});
    }
    setModalOpen(false);
    }
    catch(e){
      alert("Invalid JSON format");
    }
  }
    return (
    <>
      <Styled.StyledForeignObject
        data-id={`node-${node.id}`}
        width={node.width}
        height={node.height}
        x={0}
        y={0}
        $isObject
      >
        {(node.text as Value[]).map((val, idx) => (
          <Row
            val={val}
            index={idx}
            x={x}
            y={y}
            key={idx}
            onClick={() => handleRowClick(val[0])}
          />
        ))}
      </Styled.StyledForeignObject>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Node Content">
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Content</span>
            <Button onClick={() => setEditContent(editContent)} size="xs">Edit</Button>
          </div>
          <Textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            autosize
            minRows={5}
            disabled={false}
            style={{ fontFamily: "monospace", marginTop: 8 }}
          />
          <div style={{ marginTop: 16 }}>
            <span>JSON Path</span>
            <div style={{ fontFamily: "monospace", background: "#222", color: "#fff", padding: 4 }}>
              {`{Root}.${editPath}`}
            </div>
          </div>
                  <Button onClick={handleSave} mt="md" fullWidth>
                    Save
          </Button>
        </div>
      </Modal>
    </>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return String(prev.node.text) === String(next.node.text) && prev.node.width === next.node.width;
}

export const ObjectNode = React.memo(Node, propsAreEqual);
