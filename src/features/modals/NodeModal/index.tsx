import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  return JSON.stringify(text, null, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const nodes = useGraph(state => state.nodes);
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const setNodes = useGraph.setState;
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
                        let parsed = JSON.parse(editText);
                        // Always store as array of key-value pairs for GraphView
                        let toStore = parsed;
                        if (Array.isArray(parsed) && parsed.every(item => Array.isArray(item) && item.length === 2)) {
                          // Already array of pairs
                          toStore = parsed;
                        } else if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                          // Convert object to array of pairs
                          toStore = Object.entries(parsed);
                        }
                        const updatedNodes = nodes.map(node =>
                          node.id === selectedNode.id ? { ...node, text: toStore } : node
                        );
                        setNodes({ nodes: updatedNodes });
                        setSelectedNode({ ...selectedNode, text: toStore });
                        const pretty = dataToString(toStore);
                        setEditText(pretty);
                        setOriginalText(pretty);
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
