import React from "react";
import { useTheme } from "styled-components";
import { JSONTree } from "react-json-tree";
import useJson from "../../../../store/useJson";
import { Label } from "./Label";
import { Value } from "./Value";

export const TreeView = () => {
  const theme = useTheme();
  const json = useJson(state => state.json);
  const setJson = useJson(state => state.setJson);

  const handleEditValue = (keyPath: string[], newValue: unknown) => {
    const parsed = JSON.parse(json);
    let obj = parsed;
    // Traverse to the parent of the target key
    for (let i = keyPath.length - 1; i > 0; i--) {
      obj = obj[keyPath[i]];
    }
    obj[keyPath[0]] = newValue;
    setJson(JSON.stringify(parsed, null, 2));
  };

  return (
    <JSONTree
      hideRoot
      data={JSON.parse(json)}
      valueRenderer={(valueAsString, value, ...rest) => {
        const keyPath = rest[1];
        if (!Array.isArray(keyPath)) {
          return <Value valueAsString={valueAsString} value={value} />;
        }
        return (
          <Value
            valueAsString={valueAsString}
            value={value}
            onEditValue={newValue => handleEditValue(keyPath as string[], newValue)}
          />
        );
      }}
      labelRenderer={(keyPath, nodeType) => <Label {...{ keyPath, nodeType }} />}
      theme={{
        extend: {
          overflow: "scroll",
          height: "100%",
          scheme: "monokai",
          author: "wimer hazenberg (http://www.monokai.nl)",
          base00: theme.GRID_BG_COLOR,
        },
      }}
    />
  );
};