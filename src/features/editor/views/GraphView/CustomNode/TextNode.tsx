import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { MdLink, MdLinkOff, MdEdit } from "react-icons/md";
import type { CustomNodeProps } from ".";
import useToggleHide from "../../../../../hooks/useToggleHide";
import useConfig from "../../../../../store/useConfig";
import { isContentImage } from "../lib/utils/calculateNodeSize";
import useGraph from "../stores/useGraph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";

// ...existing styled components...

const StyledEditButton = styled.button`
  pointer-events: all;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.TEXT_NORMAL};
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 2px;
  margin-left: 8px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background: ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
  }
`;

const StyledEditActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 60px;
  font-family: monospace;
  font-size: 14px;
  border-radius: 2px;
  border: 1px solid ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
  background: ${({ theme }) => theme.BACKGROUND_PRIMARY};
  color: ${({ theme }) => theme.TEXT_NORMAL};
  padding: 8px;
  resize: vertical;
`;

const Node = ({ node, x, y, hasCollapse = false }: CustomNodeProps) => {
  const {
    id,
    text,
    width,
    height,
    data: { isParent, childrenCount, type },
  } = node;
  const { validateHiddenNodes } = useToggleHide();
  const collapseButtonVisible = useConfig(state => state.collapseButtonVisible);
  const childrenCountVisible = useConfig(state => state.childrenCountVisible);
  const imagePreviewEnabled = useConfig(state => state.imagePreviewEnabled);
  const expandNodes = useGraph(state => state.expandNodes);
  const collapseNodes = useGraph(state => state.collapseNodes);
  const isExpanded = useGraph(state => state.collapsedParents.includes(id));
  const isImage = imagePreviewEnabled && isContentImage(text as string);
  const value = JSON.stringify(text, null, 2);

  // --- Edit state ---
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const updateNodeValue = useGraph(state => state.updateNodeValue); // You may need to implement this in your store
  const updateEditorJson = useGraph(state => state.updateEditorJson); // You may need to implement this in your store

  const handleExpand = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isExpanded) collapseNodes(id);
    else expandNodes(id);
    validateHiddenNodes();
  };

  const childrenCountText = useMemo(() => {
    if (type === "object") return `{${childrenCount}}`;
    if (type === "array") return `[${childrenCount}]`;
    return "";
  }, [childrenCount, type]);

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      updateNodeValue(id, parsed); // update node value in graph store
      updateEditorJson(); // update left editor (implement to sync with graph)
      setIsEditing(false);
    } catch (err) {
      alert("Invalid JSON format.");
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      width={width}
      height={height}
      x={0}
      y={0}
    >
      {isImage ? (
        <StyledImageWrapper>
          <StyledImage src={text as string} width="70" height="70" loading="lazy" />
        </StyledImageWrapper>
      ) : (
        <StyledTextNodeWrapper
          data-x={x}
          data-y={y}
          data-key={JSON.stringify(text)}
          $hasCollapse={isParent && collapseButtonVisible}
          $isParent={isParent}
        >
          {isEditing ? (
            <div style={{ width: "100%" }}>
              <StyledTextarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
              />
              <StyledEditActions>
                <StyledEditButton onClick={handleSave} style={{ background: "#27ae60", color: "#fff" }}>
                  Save
                </StyledEditButton>
                <StyledEditButton onClick={handleCancel} style={{ background: "#7f8c8d", color: "#fff" }}>
                  Cancel
                </StyledEditButton>
              </StyledEditActions>
            </div>
          ) : (
            <>
              <Styled.StyledKey $value={value} $parent={isParent} $type={type}>
                <TextRenderer>{value}</TextRenderer>
              </Styled.StyledKey>
              <StyledEditButton aria-label="Edit" onClick={handleEditClick}>
                <MdEdit size={16} />
                Edit
              </StyledEditButton>
              {isParent && childrenCount > 0 && childrenCountVisible && (
                <Styled.StyledChildrenCount>{childrenCountText}</Styled.StyledChildrenCount>
              )}
              {isParent && hasCollapse && collapseButtonVisible && (
                <StyledExpand aria-label="Expand" onClick={handleExpand}>
                  {isExpanded ? <MdLinkOff size={18} /> : <MdLink size={18} />}
                </StyledExpand>
              )}
            </>
          )}
        </StyledTextNodeWrapper>
      )}
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return (
    prev.node.text === next.node.text &&
    prev.node.width === next.node.width &&
    prev.node.data.childrenCount === next.node.data.childrenCount
  );
}

export const TextNode = React.memo(Node, propsAreEqual);

// --- You need to implement updateNodeValue and updateEditorJson in your useGraph store ---
// Example signatures:
// updateNodeValue: (id: string, newValue: any) => void
// updateEditorJson: () => void