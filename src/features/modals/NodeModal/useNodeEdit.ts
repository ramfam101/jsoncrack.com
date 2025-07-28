import React from 'react';
import type { UseNodeEditReturns } from './types';
import useFile from '../../../store/useFile';
import useGraph from '../../editor/views/GraphView/stores/useGraph';
import useJson from '../../../store/useJson';

export const useNodeEdit = (initialValue: string): UseNodeEditReturns => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(initialValue);
    
    const setContents = useFile(state => state.setContents);
    const getJson = useJson(state => state.getJson);
    const selectedNode = useGraph(state => state.selectedNode);
    const setNodes = useGraph(state => state.setNodes);
    const nodes = useGraph(state => state.nodes);

    const handleEdit = () => {
        setEditValue(initialValue);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditValue(initialValue);
    };

    const handleSave = async () => {
        if (!selectedNode?.path) return;

        try {
            // Get the current JSON structure
            const currentJson = JSON.parse(getJson());
            
            // Navigate to the parent object that contains our target
            let target = currentJson;
            const path = selectedNode.path;
            
            // Navigate to the parent object
            for (let i = 0; i < path.length - 1; i++) {
                target = target[path[i]];
            }

            // Update the value at the final path segment
            const lastKey = path[path.length - 1];
            
            // Try to parse the editValue as JSON if possible
            let newValue;
            try {
                newValue = JSON.parse(editValue);
            } catch {
                // If it's not valid JSON, use the raw string
                newValue = editValue;
            }
            
            // Update the value
            target[lastKey] = newValue;

            // Update the graph store state first
            const updatedNodes = nodes.map(node => {
                if (node.id === selectedNode.id) {
                    // If the new value is an object, we need to reconstruct the text structure
                    if (typeof newValue === 'object' && newValue !== null) {
                        const newText = Object.entries(newValue).map(([key, value]) => ({
                            key,
                            value: String(value),
                            type: typeof value
                        }));
                        return {
                            ...node,
                            text: newText
                        };
                    } else {
                        // For primitive values, just update the first text element
                        return {
                            ...node,
                            text: [{
                                ...node.text[0],
                                value: String(newValue)
                            }]
                        };
                    }
                }
                return node;
            });

            const updatedNode = updatedNodes.find(node => node.id === selectedNode.id);
            if (updatedNode) {
                // Update both nodes and selectedNode in one state update
                useGraph.setState(state => ({
                    ...state,
                    nodes: updatedNodes,
                    selectedNode: updatedNode
                }));
            }

            // Then update the file contents
            await setContents({ contents: JSON.stringify(currentJson, null, 2) });

            // Finally update local state
            setIsEditing(false);
            // Update the editValue to reflect the new normalized data
            if (typeof newValue === 'object' && newValue !== null) {
                setEditValue(JSON.stringify(newValue, null, 2));
            } else {
                setEditValue(String(newValue));
            }
        } catch (error) {
            console.error('Failed to update node:', error);
            // You might want to show an error toast here
        }
    };

    const handleEditValueChange = (value: string) => {
        setEditValue(value);
    };

    return {
        isEditing,
        editValue,
        handleEdit,
        handleCancel,
        handleSave,
        handleEditValueChange
    };
};
