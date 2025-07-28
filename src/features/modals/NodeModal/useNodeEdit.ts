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

    const handleSave = () => {
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

            // First, exit edit mode
            setIsEditing(false);
            
            // Then update edit value
            setEditValue(JSON.stringify(newValue, null, 2));

            // Finally update the actual data
            setContents({ contents: JSON.stringify(currentJson, null, 2) });

            // Update the nodes in the graph
            const updatedNodes = nodes.map(node => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        text: [{
                            ...node.text[0],
                            value: newValue
                        }]
                    };
                }
                return node;
            });

            // Update the graph nodes
            setNodes(updatedNodes);
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
