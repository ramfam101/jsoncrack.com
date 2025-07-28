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
          onClick={() => {
            console.log('Edit button clicked');
            onEdit();
          }}
        >
          Edit
        </Button>
      ) : (
        <>
          <Button
            size="xs"
            variant="light"
            color="green"
            onClick={async () => {
              console.log('Save button clicked');
              try {
                await onSave();
                console.log('Save completed');
              } catch (error) {
                console.error('Save failed:', error);
              }
            }}
          >
            Save
          </Button>
          <Button
            size="xs"
            variant="light"
            color="gray"
            onClick={() => {
              console.log('Cancel button clicked');
              onCancel();
            }}
          >
            Cancel
          </Button>
        </>
      )}
    </Group>
  );
};
