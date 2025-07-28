import React from 'react';
import type { UseNodeEditReturns } from './types';
import useFile from '../../../store/useFile';
import useGraph from '../../editor/views/GraphView/stores/useGraph';
import useJson from '../../../store/useJson';
import type { NodeData } from '../../../types/graph';

export const useNodeEdit = (initialValue: string): UseNodeEditReturns => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(initialValue);
    
    const setContents = useFile(state => state.setContents);
    const getJson = useJson(state => state.getJson);
    const selectedNode = useGraph(state => state.selectedNode);
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
        console.log('handleSave called');
        if (!selectedNode?.path) {
            console.log('No selectedNode or path');
            return;
        }

        try {
            console.log('Starting save process');
            // Get the current JSON structure
            const currentJson = JSON.parse(getJson());
            console.log('Current JSON parsed successfully');
            
            // Parse the path string to get path segments
            // The path format is like "{Root}.customer.name" or "Root[0].items"
            const pathString = selectedNode.path;
            console.log('Path string:', pathString);
            
            // Remove the root part and split by dots
            let pathWithoutRoot = pathString;
            if (pathString.startsWith('{Root}')) {
                pathWithoutRoot = pathString.substring(6); // Remove "{Root}"
            } else if (pathString.startsWith('Root')) {
                pathWithoutRoot = pathString.substring(4); // Remove "Root"
            }
            
            // Remove leading dot if present
            if (pathWithoutRoot.startsWith('.')) {
                pathWithoutRoot = pathWithoutRoot.substring(1);
            }
            
            console.log('Path without root:', pathWithoutRoot);
            
            if (!pathWithoutRoot) {
                console.log('No path segments after removing root');
                return;
            }
            
            const pathSegments = pathWithoutRoot.split('.').flatMap(segment => {
                // Handle array indices like "items[0]"
                const match = segment.match(/^(.+)\[(\d+)\]$/);
                if (match) {
                    return [match[1], match[2]];
                }
                return [segment];
            });
            console.log('Path segments:', pathSegments);
            
            // Navigate to the parent object that contains our target
            let target = currentJson;
            for (let i = 0; i < pathSegments.length - 1; i++) {
                const segment = pathSegments[i];
                // Check if the next segment is a number (array index)
                const nextSegment = pathSegments[i + 1];
                if (!isNaN(Number(nextSegment))) {
                    // This is an array index, skip to the next segment
                    target = target[segment][Number(nextSegment)];
                    i++; // Skip the next segment since we already used it
                } else {
                    target = target[segment];
                }
            }

            // Update the value at the final path segment
            const lastSegment = pathSegments[pathSegments.length - 1];
            console.log('Last segment:', lastSegment);
            console.log('Target before update:', target);
            
            // Try to parse the editValue as JSON if possible
            let newValue;
            try {
                newValue = JSON.parse(editValue);
                console.log('Parsed newValue as JSON:', newValue);
            } catch {
                // If it's not valid JSON, use the raw string
                newValue = editValue;
                console.log('Using raw string as newValue:', newValue);
            }
            
            // Update the value
            target[lastSegment] = newValue;
            console.log('Value updated in target');

            // Update the graph store state first
            const updatedNodes = nodes.map(node => {
                if (node.id === selectedNode.id) {
                    // If the new value is an object, we need to reconstruct the text structure
                    if (typeof newValue === 'object' && newValue !== null) {
                        const newText = Object.entries(newValue).map(([key, value]) => [key, String(value)]) as [string, string][];
                        return {
                            ...node,
                            text: newText
                        };
                    } else {
                        // For primitive values, just update the text
                        return {
                            ...node,
                            text: String(newValue)
                        };
                    }
                }
                return node;
            });

            const updatedNode = updatedNodes.find(node => node.id === selectedNode.id);
            if (updatedNode) {
                console.log('Updating graph state');
                // Update both nodes and selectedNode in one state update
                useGraph.setState(state => ({
                    ...state,
                    nodes: updatedNodes,
                    selectedNode: updatedNode as NodeData
                }));
            }

            // Then update the file contents
            console.log('Updating file contents');
            await setContents({ contents: JSON.stringify(currentJson, null, 2) });

            // Finally update local state
            setIsEditing(false);
            // Update the editValue to reflect the new normalized data
            if (typeof newValue === 'object' && newValue !== null) {
                setEditValue(JSON.stringify(newValue, null, 2));
            } else {
                setEditValue(String(newValue));
            }
            console.log('Save completed successfully');
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
