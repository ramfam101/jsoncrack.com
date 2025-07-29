import React, { useState } from "react";
import { FaPencilAlt} from "react-icons/fa";
import NodeContentModal from "../../../../modals/NodeContentModal";
import { useFile } from "../../../../../store/useFile";
import { setValueAtPath } from "../../../../../utils";

interface GraphNodeProps {
    path: string;
    value: any;
}
export default function GraphNode({path, value}: GraphNodeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const jsonText = useFile((s) => s.contents);
    const updateFileContent = useFile((s) => s.updateFileContent);

    function handleSave(edited: string) {
        try {
           const root = JSON.parse(jsonText);
           setValueAtPath(root, path, JSON.parse(edited));
            updateFileContent({contents: JSON.stringify(root, null, 2)});
            setIsOpen(false);
        } catch (err) {
            console.error("Invalid JSON in node edit", err);
        }
    }
    return (
        <div className="graph-node">
            <div className="graph-node-header">
                <span>{path}</span>
                <button onClick={() => setIsOpen(true)} title="Edit this Node">
                    <FaPencilAlt />
                </button>
            </div>

            {/* ...your existing render of 'value'... */}

            {isOpen && (
                <NodeContentModal
                    content={JSON.stringify(value, null, 2)}
                    onSave={handleSave}
                    onCancel={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}