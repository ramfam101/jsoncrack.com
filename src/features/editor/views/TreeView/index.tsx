import React from "react";
import { useTheme } from "styled-components";
import { JSONTree } from "react-json-tree";
import useJson from "../../../../store/useJson";
import { Label } from "./Label";
import { Value } from "./Value";

export const TreeView = () => {
  const theme = useTheme();
  const { json, json_version } = useJson(state => ({
    json: state.json,
    json_version: state.json_version,
  }));

  let parsed: any = {};
  try {
    // Parse and deep clone to force new object identity
    parsed = JSON.parse(JSON.stringify(JSON.parse(json)));
  } catch {
    // fallback empty object on parse error
    parsed = {};
  }

  return (
    <JSONTree
      key={json_version}
      hideRoot
      data={parsed}
      valueRenderer={(valueAsString, value) => <Value {...{ valueAsString, value }} />}
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
