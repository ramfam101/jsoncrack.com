import React from "react";
import { Button, Group } from "@mantine/core";
import type { NodeEditFormProps } from "./types";

export const NodeEditForm: React.FC<NodeEditFormProps> = ({
  isEditing,
  onEdit,
  onCancel,
  onSave,
}) => {
  return (
    <Group gap="xs">
      {!isEditing ? (
        <Button
          size="xs"
          variant="light"
          color="blue"
          onClick={onEdit}
        >
          Edit
        </Button>
      ) : (
        <>
          <Button
            size="xs"
            variant="light"
            color="green"
            onClick={onSave}
          >
            Save
          </Button>
          <Button
            size="xs"
            variant="light"
            color="gray"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </>
      )}
    </Group>
  );
};
