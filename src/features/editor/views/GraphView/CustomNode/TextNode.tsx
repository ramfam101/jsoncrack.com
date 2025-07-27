import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { MdLink, MdLinkOff } from "react-icons/md";
import type { CustomNodeProps } from ".";
import useToggleHide from "../../../../../hooks/useToggleHide";
import useConfig from "../../../../../store/useConfig";
import { isContentImage } from "../lib/utils/calculateNodeSize";
import useGraph from "../stores/useGraph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import { shallow } from "zustand/shallow";

const StyledExpand = styled.button`
  pointer-events: all;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.TEXT_NORMAL};
  background: rgba(0, 0, 0, 0.1);
  height: 100%;
  width: 36px;
  border-left: 1px solid ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};

  &:hover {
    background-image: linear-gradient(rgba(0, 0, 0, 0.1) 0 0);
  }
`;

const StyledTextNodeWrapper = styled.span<{ $hasCollapse: boolean; $isParent: boolean }>`
  display: flex;
  justify-content: flex-start; // <-- Always align items to the left
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: ${({ $hasCollapse }) => ($hasCollapse ? "0" : "0 10px")};
`;

const StyledImageWrapper = styled.div`
  padding: 5px;
`;

const StyledImage = styled.img`
  border-radius: 2px;
  object-fit: contain;
  background: ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
`;

const Node = ({ node, x, y, hasCollapse = false }: CustomNodeProps) => {
  const updateNodeValue = useGraph(state => state.updateNodeValue);
  const selectedNode = useGraph(state => state.selectedNode, shallow);
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.text);
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
  const value = JSON.stringify(text).replaceAll('"', "");

  // Check if this node is selected
  const isSelected = selectedNode?.id === id;

  const handleExpand = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    // Check if needs to be removed
    if (!isExpanded) collapseNodes(id);
    else expandNodes(id);
    validateHiddenNodes();
  };

  // Handle edit button click
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true); };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNodeValue(id, editValue);
    setEditing(false);
  };

  // User input for editing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  
  const childrenCountText = useMemo(() => {
    if (type === "object") return `{${childrenCount}}`;
    if (type === "array") return `[${childrenCount}]`;
    return "";
  }, [childrenCount, type]);

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
          onClick={e => {
            e.stopPropagation();
            setSelectedNode(node);
          }}
        >
          <Styled.StyledKey $value={value} $parent={isParent} $type={type}>
            {/* Content and path */}
            <span style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1, overflow: "hidden" }}>
              <TextRenderer>{value}</TextRenderer>
              {node.path && (
                <span
                  style={{
                    color: "#888",
                    fontSize: 11,
                    marginLeft: 8,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    maxWidth: 120,
                  }}
                  title={node.path}
                >
                  {node.path}
                </span>
              )}
            </span>
            {/* Edit button or editing controls */}
            {isSelected && !editing && (
              <button
                onClick={handleEdit}
                style={{
                  marginLeft: 12,
                  fontSize: 12,
                  padding: "2px 12px",
                  cursor: "pointer",
                  borderRadius: 3,
                  border: "1px solid #27ae60",
                  background: "#27ae60",
                  color: "#fff",
                  fontWeight: 600,
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                Edit
              </button>
            )}
            {isSelected && editing && (
              <>
                <input
                  type="text"
                  value={editValue}
                  onChange={handleInputChange}
                  style={{ width: "80px", marginLeft: 12 }}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSave(e as any);
                  }}
                />
                <button
                  onClick={handleSave}
                  style={{
                    marginLeft: 4,
                    background: "#27ae60",
                    color: "#fff",
                    border: "1px solid #27ae60",
                    borderRadius: 3,
                    padding: "2px 10px",
                    fontWeight: 600,
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    marginLeft: 4,
                    background: "#fff",
                    color: "#888",
                    border: "1px solid #ccc",
                    borderRadius: 3,
                    padding: "2px 10px",
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </Styled.StyledKey>
          {isParent && childrenCount > 0 && childrenCountVisible && (
            <Styled.StyledChildrenCount>{childrenCountText}</Styled.StyledChildrenCount>
          )}
          {isParent && hasCollapse && collapseButtonVisible && (
            <StyledExpand aria-label="Expand" onClick={handleExpand}>
              {isExpanded ? <MdLinkOff size={18} /> : <MdLink size={18} />}
            </StyledExpand>
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
