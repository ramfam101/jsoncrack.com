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
    parsed = JSON.parse(json); // safe parse
  } catch {
    parsed = {}; // fallback
  }

  return (
    <JSONTree
      key={json_version} // ✅ Force re-render on each setJson()
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
