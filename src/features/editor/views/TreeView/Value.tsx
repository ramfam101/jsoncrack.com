import React, { useState } from "react";
import type { DefaultTheme } from "styled-components";
import { useTheme } from "styled-components";
import { TextRenderer } from "../GraphView/CustomNode/TextRenderer";

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
  onEditValue?: (newValue: unknown) => void;
}

export const Value = (props: ValueProps) => {
  const theme = useTheme();
  const { valueAsString, value, onEditValue } = props;

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (onEditValue) {
      onEditValue(editValue);
    }
    setEditing(false);
  };

  return (
    <span
      style={{
        color: getValueColor({
          theme,
          $value: valueAsString,
        }),
      }}
    >
      {editing ? (
        <>
          <input
            value={editValue as string}
            onChange={e => setEditValue(e.target.value)}
            style={{ marginRight: 4}}
          />
          <button onClick={handleSave} style={{ marginRight: 2 }}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
          </>
      ) : (
       <>
          <TextRenderer>{JSON.stringify(value)}</TextRenderer>
          <button
            onClick={() => setEditing(true)}
            style={{ marginLeft: 6, fontSize: "0.8em" }}
            aria-label="Edit value"
          >
            Edit
          </button>
        </>
      )}
    </span>
  );
};