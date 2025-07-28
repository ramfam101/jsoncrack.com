export intexport interface UseNodeEditReturns {
    isEditing: boolean;
    editValue: string;
    handleEdit: () => void;
    handleCancel: () => void;
    handleSave: () => Promise<void>;
    handleEditValueChange: (value: string) => void;
    setEditValue: (value: string) => void;
}odeEditFormProps {
    isEditing: boolean
    editValue: string;
    nodeData: string;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
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