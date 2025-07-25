import React from "react";
import { Modal, Button, Textarea } from "@mantine/core";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

export default function EditNodeModal({ opened, onClose, initialValue }: {
  opened: boolean;
  onClose: () => void;
  initialValue: string;
}) {
  const [value, setValue] = React.useState(initialValue);

  // Update local state when initialValue changes (e.g. switching nodes)
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // You need to implement this in your store!
  const updateSelectedNodeText = useGraph(state => state.updateSelectedNodeText);

  const handleSave = () => {
    updateSelectedNodeText(value);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} size="lg" centered title="Edit Node Text">
      <Textarea
        value={value}
        onChange={e => setValue(e.currentTarget.value)}
        minRows={6}
        autosize
        label="Node Text"
      />
      <Button mt="md" color="green" onClick={handleSave}>
        Save
      </Button>
    </Modal>
  );
}