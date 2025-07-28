import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { NodeEditForm } from "./NodeEditForm";
import { useNodeEdit } from "./useNodeEdit";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows) return "{}";
  
  // If text is a string, return it as is
  if (typeof nodeRows === "string") {
    return nodeRows;
  }
  
  // If text is an array of [key, value] pairs
  if (Array.isArray(nodeRows)) {
    if (nodeRows.length === 0) return "{}";
    if (nodeRows.length === 1 && !nodeRows[0][0]) return `${nodeRows[0][1]}`;

    const obj = {};
    nodeRows?.forEach(([key, value]) => {
      if (key) obj[key] = value;
    });
    return JSON.stringify(obj, null, 2);
  }
  
  return "{}";
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path) return "$";
  // The path is already a formatted string, so we can return it directly
  // or format it as a JSONPath expression
  return path.startsWith("$") ? path : `$.${path}`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const [normalizedData, setNormalizedData] = React.useState("");

  React.useEffect(() => {
    if (nodeData?.text) {
      setNormalizedData(normalizeNodeData(nodeData.text));
    }
  }, [nodeData?.text]);

  const { 
    isEditing,
    editValue,
    handleEdit,
    handleCancel,
    handleSave,
    handleEditValueChange
  } = useNodeEdit(normalizedData);

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center" gap="md">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Flex gap="md" align="center">
              <NodeEditForm
                isEditing={isEditing}
                editValue={editValue}
                nodeData={normalizedData}
                onEdit={handleEdit}
                onCancel={handleCancel}
                onSave={handleSave}
                onEditValueChange={handleEditValueChange}
              />
              <CloseButton onClick={onClose} />
            </Flex>
          </Flex>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <div style={{ 
                fontFamily: 'monospace',
                fontSize: '13px',
                backgroundColor: 'var(--mantine-color-dark-8)',
                borderRadius: '4px',
                padding: '12px'
              }}>
                <Textarea
                  value={editValue}
                  onChange={(e) => handleEditValueChange(e.currentTarget.value)}
                  autosize
                  minRows={3}
                  maxRows={10}
                  styles={{
                    input: {
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--mantine-color-white)',
                      '&:focus': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <CodeHighlight
                code={normalizedData}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
