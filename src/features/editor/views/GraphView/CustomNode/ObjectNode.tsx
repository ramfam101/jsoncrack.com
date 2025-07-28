import React from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";

// Allow any value type, not just string
type Value = [string, any];

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

const Node = ({ node, x, y }: CustomNodeProps) => (
  <Styled.StyledForeignObject
    data-id={`node-${node.id}`}
    width={node.width}
    height={node.height}
    x={0}
    y={0}
    $isObject
  >
    {Array.isArray(node.text)
      ? (node.text as Value[]).map((val, idx) => (
          <Row val={val} index={idx} x={x} y={y} key={idx} />
        ))
      : typeof node.text === "object" && node.text !== null
        ? Object.entries(node.text).map(([key, value], idx) => (
            <Row val={[key, value]} index={idx} x={x} y={y} key={idx} />
          ))
        : <TextRenderer>{String(node.text)}</TextRenderer>
    }
  </Styled.StyledForeignObject>
);

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return String(prev.node.text) === String(next.node.text) && prev.node.width === next.node.width;
}

export const ObjectNode = React.memo(Node, propsAreEqual);

