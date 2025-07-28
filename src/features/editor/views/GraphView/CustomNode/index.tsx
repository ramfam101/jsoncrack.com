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

    console.log("CustomNode render - nodeProps.id:", nodeProps.id);
    console.log("CustomNode render - nodeProps.properties:", nodeProps.properties);

    // Create a simple click handler that we know will work
    const handleClick = (event: React.MouseEvent) => {
        console.log("🎯 CLICK DETECTED on node:", nodeProps.id);
        console.log("Event target:", event.target);
        console.log("Current target:", event.currentTarget);

        event.preventDefault();
        event.stopPropagation();

        const nodeData = nodeProps.properties as NodeData;
        console.log("Node data to set:", nodeData);

        setSelectedNode(nodeData);

        // Open modal after a brief delay to ensure state updates
        setTimeout(() => {
            console.log("Opening modal...");
            setVisible("NodeModal", true);
        }, 50);
    };

    return (
        <Node
            {...nodeProps}
            {...(data?.isEmpty && rootProps)}
            onClick={(e) => {
                console.log("🔥 Node component onClick triggered");
                handleClick(e as React.MouseEvent);
            }}
            animated={false}
            label={null as any}
            onEnter={ev => {
                console.log("Mouse entered node:", nodeProps.id);
                ev.currentTarget.style.stroke = "#3B82F6";
            }}
            onLeave={ev => {
                console.log("Mouse left node:", nodeProps.id);
                ev.currentTarget.style.stroke = colorScheme === "dark" ? "#424242" : "#BCBEC0";
            }}
            style={{
                fill: colorScheme === "dark" ? "#292929" : "#ffffff",
                stroke: colorScheme === "dark" ? "#424242" : "#BCBEC0",
                strokeWidth: 1,
                cursor: 'pointer'
            }}
        >
            {({ node, x, y }) => (
                <g
                    data-testid="open-node-modal"
                    onClick={handleClick}
                    onMouseEnter={() => console.log("🐭 Mouse entered g element for node:", nodeProps.id)}
                    onMouseLeave={() => console.log("🐭 Mouse left g element for node:", nodeProps.id)}
                    style={{
                        cursor: 'pointer',
                        pointerEvents: 'all'
                    }}
                >
                    {Array.isArray(nodeProps.properties.text) ? (
                        data?.isEmpty ? null : <ObjectNode node={node as NodeData} x={x} y={y} />
                    ) : (
                        <TextNode node={node as NodeData} hasCollapse={!!data?.childrenCount} x={x} y={y} />
                    )}
                </g>
            )}
        </Node>
    );
};

export const CustomNode = React.memo(CustomNodeWrapper);