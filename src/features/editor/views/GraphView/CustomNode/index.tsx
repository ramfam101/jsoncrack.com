import React from "react";
import { useComputedColorScheme } from "@mantine/core";
import type { NodeProps } from "reaflow";
import { Node } from "reaflow";
import { useModal } from "../../../../../store/useModal";
import type { NodeData } from "../../../../../types/graph";
import useGraph from "../stores/useGraph";
import { ObjectNode } from "./ObjectNode";
import { TextNode } from "./TextNode";

export interface UniqueNodeProps {
  node: NodeData;
  x: number;
  y: number;
  hasCollapse?: boolean;
}

const rootNodeShape = {
  rx: 50,
  ry: 50,
};

const UniqueNodeComponent = (props: NodeProps<NodeData["data"]>) => {
  const nodeData = props.properties.data;
  const selectNode = useGraph(store => store.setSelectedNode);
  const showModal = useModal(store => store.setVisible);
  const scheme = useComputedColorScheme();

  const handleNodeSelect = React.useCallback(
    (_: React.MouseEvent<SVGGElement, MouseEvent>, node: NodeData) => {
      if (selectNode) selectNode(node);
      showModal("NodeModal", true);
    },
    [selectNode, showModal]
  );

  return (
    <Node
      {...props}
      {...(nodeData?.isEmpty && rootNodeShape)}
      onClick={handleNodeSelect as any}
      animated={false}
      label={null as any}
      onEnter={ev => {
        ev.currentTarget.style.stroke = "#3B82F6";
      }}
      onLeave={ev => {
        ev.currentTarget.style.stroke = scheme === "dark" ? "#424242" : "#BCBEC0";
      }}
      style={{
        fill: scheme === "dark" ? "#292929" : "#ffffff",
        stroke: scheme === "dark" ? "#424242" : "#BCBEC0",
        strokeWidth: 1,
      }}
    >
      {({ node, x, y }) => (
        <g data-testid="open-node-modal">
          {Array.isArray(props.properties.text) ? (
            nodeData?.isEmpty ? null : (
              <ObjectNode node={node as NodeData} x={x} y={y} />
            )
          ) : (
            <TextNode node={node as NodeData} hasCollapse={!!nodeData?.childrenCount} x={x} y={y} />
          )}
        </g>
      )}
    </Node>
  );
};

export const CustomNode = React.memo(UniqueNodeComponent);