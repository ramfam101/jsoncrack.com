import React from "react";
import { useComputedColorScheme } from "@mantine/core";
import type { NodeProps } from "reaflow";
import { Node } from "reaflow";
import { useModal } from "../../../../../store/useModal";
import type { NodeData } from "../../../../../types/graph";
import useGraph from "../stores/useGraph";
import { ObjectNode } from "./ObjectNode";
import { TextNode } from "./TextNode";

export interface CustomNodeProps {
  node: NodeData;
  x: number;
  y: number;
  hasCollapse?: boolean;
}

const rootProps = {
  rx: 50,
  ry: 50,
};

const CustomNodeWrapper = (nodeProps: NodeProps<NodeData["data"]>) => {
  const data = nodeProps.properties.data;
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const setVisible = useModal(state => state.setVisible);
  const colorScheme = useComputedColorScheme();

  const handleNodeClick = React.useCallback(
    (_: React.MouseEvent<SVGGElement, MouseEvent>, data: NodeData) => {
      if (setSelectedNode) setSelectedNode(data);
      setVisible("NodeModal", true);
    },
    [setSelectedNode, setVisible]
  );

  return (
    <Node
      {...nodeProps}
      {...(data?.isEmpty && rootProps)}
      onClick={handleNodeClick as any}
      animated={false}
      label={null as any}
      onEnter={ev => {
        ev.currentTarget.style.stroke = "#3B82F6";
      }}
      onLeave={ev => {
        ev.currentTarget.style.stroke = colorScheme === "dark" ? "#424242" : "#BCBEC0";
      }}
      style={{
        fill: colorScheme === "dark" ? "#292929" : "#ffffff",
        stroke: colorScheme === "dark" ? "#424242" : "#BCBEC0",
        strokeWidth: 1,
      }}
    >
      {({ node, x, y }) => (
        //worked when placed here with a <G>
        <g data-testid="open-node-modal">
          {Array.isArray(nodeProps.properties.text) ? (
            data?.isEmpty ? null : <ObjectNode node={node as NodeData} x={x} y={y} />
          ) : (
            <TextNode node={node as NodeData} hasCollapse={!!data?.childrenCount} x={x} y={y} />
          )}
          {/* Edit button overlay */}
          <foreignObject x={x - 20} y={y - 40} width={40} height={30} style={{ pointerEvents: "auto" }}>
            <button
              style={{ fontSize: 12, padding: "2px 6px", borderRadius: 4, border: "1px solid #ccc", background: "#f3f3f3", cursor: "pointer" }}
              onClick={e => {
                e.stopPropagation();
                setSelectedNode(node as NodeData);
                setVisible("NodeModal", true);
              }}
            >
              Edit
            </button>
          </foreignObject>
        </g>
      )}
    </Node>
  );
};

export const CustomNode = React.memo(CustomNodeWrapper);