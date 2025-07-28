import React, { useState } from "react";
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
  onEdit: (index: number, newValue: string) => void;
};

const Row = ({ val, x, y, index, onEdit }: RowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(val[1]);

  const key = JSON.stringify(val);
  const rowKey = JSON.stringify(val[0]).replaceAll('"', "");
  const rowValue = JSON.stringify(val[1]);

  const handleEdit = () => {
    console.log('Edit clicked');
    setIsEditing(true);
  };

  const handleSave = () => {
    console.log('Save clicked, new value:', editedValue);
    setIsEditing(false);
    onEdit(index, editedValue);
  };

  return (
    <Styled.StyledRow 
      $value={rowValue} 
      data-key={key} 
      data-x={x} 
      data-y={y + (index * NODE_DIMENSIONS.ROW_HEIGHT)}
    >
      <Styled.StyledKey $type="object">{rowKey}: </Styled.StyledKey>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              style={{ padding: '2px 4px', minWidth: '100px' }}
            />
            <button 
              onClick={handleSave}
              style={{ padding: '2px 8px', cursor: 'pointer' }}
            >
              Save
            </button>
          </>
        ) : (
          <>
            <TextRenderer>{rowValue}</TextRenderer>
            <button 
              onClick={handleEdit}
              style={{ padding: '2px 8px', cursor: 'pointer' }}
            >
              Edit
            </button>
          </>
        )}
      </div>
    </Styled.StyledRow>
  );
};

const Node = ({ node, x, y }: CustomNodeProps) => {
  const [nodeText, setNodeText] = useState(node.text as Value[]);

  const handleEdit = (index: number, newValue: string) => {
    console.log('Updating node at index:', index, 'with value:', newValue);
    const updatedText = [...nodeText];
    updatedText[index] = [updatedText[index][0], newValue];
    setNodeText(updatedText);
    
    // If you need to update the global state, you can add that here
    if (node.data && typeof node.data.onChange === 'function') {
      node.data.onChange(updatedText);
    }
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
      {nodeText.map((val, idx) => (
        <Row 
          key={idx}
          val={val} 
          index={idx} 
          x={x} 
          y={y} 
          onEdit={handleEdit}
        />
      ))}
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return String(prev.node.text) === String(next.node.text) && prev.node.width === next.node.width;
}

export const ObjectNode = React.memo(Node, propsAreEqual);
