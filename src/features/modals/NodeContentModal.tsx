import { useState } from "react";

export interface NodeContentModalProps {
    content: string;
    onSave: (edited: string) => void;
    onCancel: () => void;
}

export default function NodeContentModal({
    content,
    onSave,
    onCancel,
}: NodeContentModalProps) {
    const [edited, setEdited] = useState(content);

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <textarea
                    rows={12}
                    cols={60}
                    value={edited}
                    onChange={(e)=> setEdited(e.target.value)}
                />
                <div style={{ marginTop: 12}}>
                    <button onClick={() => onSave(edited)}>Save</button>
                    <button onClick={onCancel} style={{ marginLeft: 8 }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
