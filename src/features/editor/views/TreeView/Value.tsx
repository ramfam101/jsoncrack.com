import React, { useState } from "react";
import type { DefaultTheme } from "styled-components";
import { useTheme } from "styled-components";
import { TextRenderer } from "../GraphView/CustomNode/TextRenderer";
import useJson from "../../../../store/useJson";

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
  keyPath?: (string | number)[];
}

export const Value = (props: ValueProps) => {
  const theme = useTheme();
  const { valueAsString, value, keyPath } = props;
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(JSON.stringify(value));
  const setJson = useJson(state => state.setJson); // Assumes setJson exists
  const json = useJson(state => state.json);


    // Helper to update JSON at keyPath
  const updateJsonAtPath = (jsonObj: any, path: (string | number)[], newValue: any) => {
    if (!path || path.length === 0) return newValue;
    const cloned = JSON.parse(JSON.stringify(jsonObj));
    let obj = cloned;
    for (let i = 0; i < path.length - 1; i++) {
      obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = newValue;
    return cloned;
  };

  const handleSave = () => {
    let parsed;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      parsed = editValue;
    }
    const updated = updateJsonAtPath(JSON.parse(json), keyPath || [], parsed);
    setJson(JSON.stringify(updated));
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(JSON.stringify(value));
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
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            style={{ width: "70px" }}
          />
          <button onClick={handleSave} style={{ marginLeft: 4 }}>Save</button>
          <button onClick={handleCancel} style={{ marginLeft: 2 }}>Cancel</button>
        </>
      ) : (
        <>
          <TextRenderer>{JSON.stringify(value)}</TextRenderer>
          <button onClick={() => setEditing(true)} style={{ marginLeft: 4, fontSize: "0.8em" }}>Edit</button>
        </>
      )}
    </span>
  );
};
// function useState(arg0: boolean): [any, any] {
//     throw new Error("Function not implemented.");
// }

