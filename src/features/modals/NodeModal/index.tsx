import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { Button, Textarea, Group } from "@mantine/core";
import { useState } from "react";
import useFile from "../../../store/useFile"; 

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

function nodesToJson(nodes, edges) {
  // Build a map of nodeId -> node
  const nodeMap = {};
  nodes.forEach(node => {
    nodeMap[node.id] = node;
  });

  // Build a map of parentId -> [childNode, ...]
  const childrenMap = {};
  edges.forEach(edge => {
    if (!childrenMap[edge.from]) childrenMap[edge.from] = [];
    childrenMap[edge.from].push(nodeMap[edge.to]);
  });

  // Find the root node (no incoming edges)
  const childIds = new Set(edges.map(e => e.to));
  const root = nodes.find(n => !childIds.has(n.id));
  if (!root) return {};

  // Recursively build the object
  function build(node) {
    if (childrenMap[node.id] && childrenMap[node.id].length > 0) {
      const obj = {};
      childrenMap[node.id].forEach(child => {
        const key = child.label || child.key || child.name;
        if (key !== undefined && key !== "") {
          obj[key] = build(child);
        }
      });
      return obj;
    } else if (Array.isArray(node.text)) {
      return Object.fromEntries(node.text);
    } else {
      return node.text;
    }
  }

  // Handle virtual root node (no label/key/name)
  const rootKey = root.label || root.key || root.name;
  if (!rootKey || rootKey === "") {
    // If the root has children, merge them at the top level
    if (childrenMap[root.id] && childrenMap[root.id].length > 0) {
      const result = {};
      childrenMap[root.id].forEach(child => {
        const key = child.label || child.key || child.name;
        if (key !== undefined && key !== "") {
          result[key] = build(child);
        }
      });
      return result;
    } else if (Array.isArray(root.text)) {
      return Object.fromEntries(root.text);
    } else {
      return root.text;
    }
  } else {
    // Root node has a label, use it as the top-level key
    return { [rootKey]: build(root) };
  }
}

function updateJsonAtPath(obj, path, newValue) {
  if (path.length === 1) {
    obj[path[0]] = newValue;
    return;
  }
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!(path[i] in current)) current[path[i]] = {};
    current = current[path[i]];
  }
  current[path[path.length - 1]] = newValue;
}

function reconstructJson(nodes, edges) {
  const nodeMap = {};
  nodes.forEach(node => { nodeMap[node.id] = node; });

  const childrenMap = {};
  edges.forEach(edge => {
    if (!childrenMap[edge.from]) childrenMap[edge.from] = [];
    childrenMap[edge.from].push(nodeMap[edge.to]);
  });

  const childIds = new Set(edges.map(e => e.to));
  const root = nodes.find(n => !childIds.has(n.id));
  if (!root) return {};

  function build(node) {
    const hasChildren = childrenMap[node.id] && childrenMap[node.id].length > 0;
    const isObjectNode = Array.isArray(node.text);

    // Case: leaf-like object node (e.g. Vehicles, Food)
    if (!hasChildren && isObjectNode) {
      return Object.fromEntries(node.text);
    }

    // Case: children map to nested keys (e.g. Items → Vehicles, Food)
    if (hasChildren) {
      const obj = {};
      childrenMap[node.id].forEach(child => {
        const key = typeof child.text === "string" ? child.text : undefined;
        if (key !== undefined && key !== "") {
          obj[key] = build(child);
        } else if (Array.isArray(child.text)) {
          // If child is an object, use it directly as value
          const value = Object.fromEntries(child.text);
          Object.assign(obj, value);
        }
      });
      return obj;
    }

    // Fallback: raw string value (primitive)
    return node.text;
  }

  const rootKey = typeof root.text === "string" ? root.text : undefined;
  if (!rootKey || rootKey === "") {
    const result = {};
    if (childrenMap[root.id]) {
      childrenMap[root.id].forEach(child => {
        const key = typeof child.text === "string" ? child.text : undefined;
        if (key !== undefined && key !== "") {
          result[key] = build(child);
        }
      });
    } else if (Array.isArray(root.text)) {
      return Object.fromEntries(root.text);
    } else {
      return root.text;
    }
    return result;
  } else {
    return { [rootKey]: build(root) };
  }
}


export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const path = selectedNode?.path || "";
  const [editMode, setEditMode] = useState(false);
  const [value, setValue] = useState(() => dataToString(selectedNode?.text ?? {})); // Updated to allow for empty text
  const updateNode = useGraph(state => state.updateNode); // Function to update node data in global state
  const setContents = useFile(state => state.setContents); // Added to update text editor after node update
  //const nodes = useGraph(state => state.nodes); // Added to update text editor after node update
  

  // Reset value when node changes or modal opens
  React.useEffect(() => {
    setValue(dataToString(selectedNode?.text ?? {}));
    setEditMode(false);
  }, [selectedNode, opened]);

  // Attempt to save data on press of save button
  const handleSave = () => {
  try {
    const parsed = JSON.parse(value);
    let newValue = parsed;
    if (Array.isArray(selectedNode?.text)) {
      newValue = parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? Object.entries(parsed)
        : parsed;
    }

    if (selectedNode && typeof selectedNode.id === "string") {
      updateNode(selectedNode.id, newValue);

      // --- NEW: Reconstruct JSON from current graph state ---
      const nodes = useGraph.getState().nodes;
      const edges = useGraph.getState().edges;
      const newJson = reconstructJson(nodes, edges);
      setContents({ contents: JSON.stringify(newJson, null, 2) });

      setEditMode(false);
    } else {
      alert("No node selected or invalid node id.");
    }
  } catch (e) {
    alert("Invalid JSON");
  }
};

  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <ScrollArea.Autosize mah={250} maw={600}>
             {editMode ? (
              <Textarea
                value={value}
                onChange={e => setValue(e.currentTarget.value)}
                minRows={6}
                autosize
                miw={350}
                maw={600}
              />
            ) : (
              <CodeHighlight code={value} miw={350} maw={600} language="json" withCopyButton />
            )}
          </ScrollArea.Autosize>
          <Group mt="xs">
            {editMode ? (
              <>
                <Button size="xs" onClick={handleSave}>Save</Button>
                <Button size="xs" variant="default" onClick={() => setEditMode(false)}>Cancel</Button>
              </>
            ) : (
              <Button size="xs" onClick={() => setEditMode(true)}>Edit</Button>
            )}
          </Group>
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
      </Stack>
    </Modal>
  );
};
