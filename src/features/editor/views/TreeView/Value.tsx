import React from "react";
import type { DefaultTheme } from "styled-components";
import { useTheme } from "styled-components";
import styled from "styled-components";
import { TextRenderer } from "../GraphView/CustomNode/TextRenderer";

const StyledValueContainer = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  
  &:hover .edit-button {
    opacity: 1;
  }
`;

const StyledEditButton = styled.button`
  opacity: 0;
  transition: opacity 0.2s;
  background: #22c55e;
  border: none;
  border-radius: 3px;
  color: white;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  
  &:hover {
    background: #16a34a;
  }
`;

const StyledEditInput = styled.input`
  background: ${({ theme }) => theme.BACKGROUND_NODE};
  border: 1px solid #22c55e;
  color: ${({ theme }) => theme.NODE_COLORS.TEXT};
  font-family: monospace;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
  outline: none;
  min-width: 60px;
`;

const StyledEditActions = styled.div`
  display: inline-flex;
  gap: 2px;
  margin-left: 4px;
`;

const StyledActionButton = styled.button`
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 3px;
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`;

type TextColorFn = {
  theme: DefaultTheme;
  $value?: string | unknown;
};

function getValueColor({ $value, theme }: TextColorFn) {
  if ($value && !Number.isNaN(+$value)) return theme.NODE_COLORS.INTEGER;
  if ($value === "true") return theme.NODE_COLORS.BOOL.TRUE;
  if ($value === "false") return theme.NODE_COLORS.BOOL.FALSE;
  if ($value === "null") return theme.NODE_COLORS.NULL;

  // default
  return theme.NODE_COLORS.NODE_VALUE;
}

interface ValueProps {
  valueAsString: unknown;
  value: unknown;
  keyPath?: readonly (string | number)[];
}

export const Value = (props: ValueProps) => {
  const theme = useTheme();
  const { valueAsString, value } = props;

  return (
    <span
      style={{
        color: getValueColor({
          theme,
          $value: valueAsString,
        }),
      }}
    >
      <TextRenderer>{JSON.stringify(value)}</TextRenderer>
    </span>
  );
};
