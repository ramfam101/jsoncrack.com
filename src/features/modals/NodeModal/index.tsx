import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { calculateNodeSize } from "../../editor/views/GraphView/lib/utils/calculateNodeSize";
import useFile from "../../../store/useFile";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  return JSON.stringify(text, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const nodes = useGraph(state => state.nodes);
  // Use setContents from useFile to update JSON
  const setContents = useFile(state => state.setContents);
  const contents = useFile(state => state.contents);
  const [editMode, setEditMode] = React.useState(false);
  const [editText, setEditText] = React.useState(
    dataToString(selectedNode?.text)
  );
  const [originalText, setOriginalText] = React.useState(
    dataToString(selectedNode?.text)
  );
  const nodeData = dataToString(selectedNode?.text);
  const path = selectedNode?.path || "";

  React.useEffect(() => {
    const textStr = dataToString(selectedNode?.text);
    setEditText(textStr);
    setOriginalText(textStr);
    setEditMode(false);
  }, [selectedNode]);

  return (
    <Modal
      title={<span>Node Content</span>}
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
    >
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text fz="xs" fw={500}>Content</Text>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!editMode && (
                <button
                  style={{
                    fontSize: 12,
                    padding: '2px 14px',
                    borderRadius: 6,
                    border: '1px solid #BCBEC0',
                    background: '#F3F4F6',
                    color: '#292929',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#E5E7EB')}
                  onMouseOut={e => (e.currentTarget.style.background = '#F3F4F6')}
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
              )}
              {editMode && (
                <>
                  <button
                    style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, border: '1px solid #3B82F6', background: '#3B82F6', color: '#fff', cursor: 'pointer' }}
                    onClick={() => {
                      if (!selectedNode) return;
                      try {
                        // Parse the current JSON from useFile
                        const json = JSON.parse(contents);
                        // Parse the edited value
                        const newValue = JSON.parse(editText);
                        // Find the node in the root JSON and update its value
                        if (json && selectedNode.path) {
                          // Extract the top-level key from the path, e.g. (Root).fruit -> fruit
                          const match = selectedNode.path.match(/\{Root\}\.(\w+)/);
                          if (match && match[1]) {
                            const key = match[1];
                            json[key] = newValue;
                            setContents({ contents: JSON.stringify(json, null, 2) });
                            setEditText(editText);
                            setOriginalText(editText);
                            setEditMode(false);
                            return;
                          }
                        }
                        // fallback: just update the whole JSON if path not found
                        setContents({ contents: editText });
                        setEditText(editText);
                        setOriginalText(editText);
                        setEditMode(false);
                      } catch (e) {
                        alert('Invalid JSON format. Please fix and try again.');
                      }
                    }}
                  >
                    Save
                  </button>
                  <button
                    style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, border: '1px solid #BCBEC0', background: '#F3F4F6', color: '#6B7280', cursor: 'pointer' }}
                    onClick={() => {
                      setEditText(originalText);
                      setEditMode(false);
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
          {editMode ? (
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                maxWidth: 600,
                fontSize: '14px',
                fontFamily: 'inherit',
                border: '1px solid #BCBEC0',
                borderRadius: '6px',
                padding: '8px',
                marginBottom: '8px',
                resize: 'vertical',
                background: '#fff',
                color: '#292929',
              }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          )}
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={path}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
        {/* Button group at the bottom */}
      </Stack>
    </Modal>
  );
};
