import React from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";

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

  // Local state for editing
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(rowValue);

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleEditSave = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      // To persist globally, update your store here
    }
  };

  return (
    <Styled.StyledRow $value={rowValue} data-key={key} data-x={x} data-y={y + rowPosition}>
      <Styled.StyledKey $type="object">{rowKey}: </Styled.StyledKey>
      <TextRenderer>{isEditing ? editValue : rowValue}</TextRenderer>
      {isEditing ? (
        <input
          value={editValue}
          onChange={handleEditChange}
          onKeyDown={handleEditSave}
          autoFocus
          style={{ marginLeft: 8, fontSize: 14, padding: "2px 4px", borderRadius: 2 }}
        />
      ) : (
        <button
          onClick={handleEditClick}
          style={{ marginLeft: 8, fontSize: 12, padding: "2px 6px", borderRadius: 2, cursor: "pointer" }}
        >
          Edit
        </button>
      )}
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
    {(node.text as Value[]).map((val, idx) => (
      <Row val={val} index={idx} x={x} y={y} key={idx} />
    ))}
  </Styled.StyledForeignObject>
);

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return String(prev.node.text) === String(next.node.text) && prev.node.width === next.node.width;
}

export const ObjectNode = React.memo(Node, propsAreEqual);
