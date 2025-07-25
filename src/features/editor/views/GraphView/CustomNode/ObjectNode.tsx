import React from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import { useModal } from "../../../../../store/useModal";
import useGraph from "../stores/useGraph";

type Value = [string, string];

type RowProps = {
  val: Value;
  x: number;
  y: number;
  index: number;
};

const editButtonStyle = { pointerEvents: "auto" as React.CSSProperties["pointerEvents"], marginLeft: 8 };

const Row = ({ val, x, y, index }: RowProps) => {
  const [keyName, keyValue] = val;
  const rowKey = JSON.stringify(keyName).replaceAll('"', "");
  const rowValue = JSON.stringify(keyValue);
  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;

  return (
    <Styled.StyledRow $value={rowValue} data-key={keyName} data-x={x} data-y={y + rowPosition}>
      <Styled.StyledKey $type="object">{rowKey}: </Styled.StyledKey>
      <TextRenderer>{rowValue}</TextRenderer>
    </Styled.StyledRow>
  );
};

const Node = (props: CustomNodeProps) => {
  const { node, x, y } = props;
  const setVisible = useModal(state => state.setVisible);
  const setSelectedNode = useGraph(state => state.setSelectedNode);

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNode(node);
    setVisible("NodeModal", true);
  };

  return (
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      width={node.width}
      height={node.height}
      x={0}
      y={0}
      $isObject
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          {(node.text as Value[]).map((item, idx) => (
            <Row val={item} index={idx} x={x} y={y} key={idx} />
          ))}
        </div>
        <button
          aria-label="Edit Node"
          style={editButtonStyle}
          onClick={handleEditClick}
        >
          ✏️
        </button>
      </div>
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return String(prev.node.text) === String(next.node.text) && prev.node.width === next.node.width;
}

export const ObjectNode = React.memo(Node, propsAreEqual);
