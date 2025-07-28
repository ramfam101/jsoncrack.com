export intexport interface UseNodeEditReturns {
    isEditing: boolean;
    editValue: string;
    handleEdit: () => void;
    handleCancel: () => void;
    handleSave: () => Promise<void>;
    handleEditValueChange: (value: string) => void;
    setEditValue: (value: string) => void;
}NodeEditFormProps {
    isEditing: boolean
    editValue: string;
    nodeData: string;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => Promise<void>;
    onEditValueChange: (value: string) => void;
}

export interface UseNodeEditReturns {
    isEditing: boolean;
    editValue: string;
    handleEdit: () => void;
    handleCancel: () => void
    handleSave: () => void;
    handleEditValueChange: (value: string) => void;
}