import React from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import useGraph from "../stores/useGraph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";

// testing testing
type Value = [string, string];

type RowProps = {
  val: Value;
  x: number;
  y: number;
  index: number;
};

const Row = ({ val, x, y, index }: RowProps) => {
  const key = JSON.stringify(val);
  const rowKey = JSON.stringify(val[0]).replaceAll('"', "");
  const rowValue = JSON.stringify(val[1]);

  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;

  return (
    <Styled.StyledRow $value={rowValue} data-key={key} data-x={x} data-y={y + rowPosition}>
      <Styled.StyledKey $type="object">{rowKey}: </Styled.StyledKey>
      <TextRenderer>{rowValue}</TextRenderer>
    </Styled.StyledRow>
  );
};

const Node = ({ node, x, y }: CustomNodeProps) => {
  const selectedNodePath = useGraph(state => state.selectedNodePath);
  const setSelectedNode = useGraph(state => state.setSelectedNode);

  const isSelected = node.path === selectedNodePath || node.id === selectedNodePath;

  return (
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      width={node.width}
      height={node.height}
      x={0}
      y={0}
      $isObject
      onClick={e => {
        e.stopPropagation();
        setSelectedNode(node);
      }}
      style={{ outline: isSelected ? "2px solid #0078d4" : "none" }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {(node.text as Value[]).map((val, idx) => (
          <Row val={val} index={idx} x={x} y={y} key={idx} />
        ))}
      </div>
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return String(prev.node.text) === String(next.node.text) && prev.node.width === next.node.width;
}

export const ObjectNode = React.memo(Node, propsAreEqual);
