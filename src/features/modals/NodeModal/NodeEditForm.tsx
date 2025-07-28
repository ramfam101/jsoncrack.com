import React from "react";
import { Button, Group } from "@mantine/core";

export const NodeEditForm = () => {
  const [isEditing, setIsEditing] = React.useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  return (
    <>
      {!isEditing ? (
        <Button
          size="xs"
          variant="light"
          color="blue"
          onClick={handleEditClick}
        >
          Edit
        </Button>
      ) : (
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            color="green"
          >
            Save
          </Button>
          <Button
            size="xs"
            variant="light"
            color="gray"
            onClick={handleCancelClick}
          >
            Cancel
          </Button>
        </Group>
      )}
    </>
  );
};
