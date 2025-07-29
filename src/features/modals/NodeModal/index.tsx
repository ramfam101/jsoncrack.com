import React from "react";
import type { ModalProps } from "@mantine/core";
<<<<<<< HEAD
import { Modal, Stack, Text, ScrollArea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
=======
import { Modal, Stack, Text, ScrollArea, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useFile from "../../../store/useFile";
import useJson from "../../../store/useJson";
>>>>>>> d0a08ee (Add inline node editing with Save/Cancel and immediate sync)
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const dataToString = (data: any) => {
  const text = Array.isArray(data) ? Object.fromEntries(data) : data;
  const replacer = (_: string, v: string) => {
    if (typeof v === "string") return v.replaceAll('"', "");
    return v;
  };

  return JSON.stringify(text, replacer, 2);
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
<<<<<<< HEAD
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const path = useGraph(state => state.selectedNode?.path || "");

=======
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState("");
  const [error, setError] = React.useState("");
  const [localNodeData, setLocalNodeData] = React.useState("");
  const nodeData = useGraph(state => dataToString(state.selectedNode?.text));
  const selectedNode = useGraph(state => state.selectedNode);
  const path = useGraph(state => state.selectedNode?.path || "");

  // Update local node data when nodeData changes
  React.useEffect(() => {
    setLocalNodeData(nodeData);
  }, [nodeData]);

  // Reset local state when modal opens/closes
  React.useEffect(() => {
    if (opened) {
      setLocalNodeData(nodeData);
      setIsEditing(false);
      setError("");
    }
  }, [opened, nodeData]);

  // Update editedContent when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setEditedContent(localNodeData);
      setError("");
    }
  }, [isEditing, localNodeData]);

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
  };

  const handleSave = () => {
    // Log raw textarea value for debugging
    console.log("Raw textarea value:", editedContent);
    console.log("Raw textarea length:", editedContent.length);

    // Trim and normalize the edited content before parsing
    const normalizedContent = editedContent
      .trim()
      // Replace curly/smart quotes with straight quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Remove trailing commas before closing } or ]
      .replace(/,(\s*[}\]])/g, "$1");

    // Parse the normalized content to validate JSON
    let parsedValue;
    try {
      parsedValue = JSON.parse(normalizedContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      setError("Invalid JSON format");
      return;
    }

    // Update node and sync JSON
    try {
      // Get the current full JSON
      const currentJson = useJson.getState().getJson();
      console.log("Current JSON:", currentJson);
      const fullJsonData = JSON.parse(currentJson);
      console.log("Selected node path:", selectedNode?.path);
      console.log("Parsed value:", parsedValue);
      
      // Update the specific node in the full JSON using the path
      if (selectedNode?.path) {
        console.log("Raw path:", selectedNode.path);
        
        // Handle special cases for root nodes
        if (
          selectedNode.path === "{Root}" ||
          selectedNode.path === "$" ||
          selectedNode.path === ""
        ) {
          // This is a root node, replace the entire JSON
          console.log("Root node detected - replacing entire JSON");
          const updatedJsonString = JSON.stringify(parsedValue, null, 2);
          useJson.getState().setJson(updatedJsonString);
          useFile.getState().setContents({ contents: updatedJsonString, hasChanges: true });
        } else {
          // Convert JSONPath to actual path and update the value
          const pathParts = selectedNode.path
            .replace(/^\$\.?/, "")
            .replace(/^{Root}\.?/, "")
            .split(".")
            .filter(part => part !== "" && part !== "{Root}");
          console.log("Path parts:", pathParts);
          
          if (pathParts.length === 0) {
            // If path is just root after cleaning, replace the entire JSON
            console.log("Root path after cleaning - replacing entire JSON");
            const updatedJsonString = JSON.stringify(parsedValue, null, 2);
            useJson.getState().setJson(updatedJsonString);
            useFile.getState().setContents({ contents: updatedJsonString, hasChanges: true });
          } else {
            let current = fullJsonData;
            
            // Navigate to the parent object
            for (let i = 0; i < pathParts.length - 1; i++) {
              const part = pathParts[i];
              console.log(`Navigating part ${i}: ${part}`);
              if (part.includes("[") && part.includes("]")) {
                // Handle array indices
                const [key, indexStr] = part.split("[");
                const index = parseInt(indexStr.replace("]", ""));
                console.log(`Array access: key=${key}, index=${index}`);
                if (key && key !== "") {
                  if (current[key] === undefined) {
                    console.error(`Key '${key}' not found in current object`);
                    throw new Error(`Invalid path: '${key}' not found`);
                  }
                  current = current[key];
                }
                if (isNaN(index) || current[index] === undefined) {
                  console.error(`Array index ${index} not found`);
                  throw new Error(`Invalid path: array index ${index} not found`);
                }
                current = current[index];
              } else {
                if (current[part] === undefined) {
                  console.error(`Key '${part}' not found in current object`);
                  throw new Error(`Invalid path: '${part}' not found`);
                }
                current = current[part];
              }
              console.log("Current after navigation:", current);
            }

            // Update the final value
            const lastPart = pathParts[pathParts.length - 1];
            console.log("Final part:", lastPart);
            if (lastPart.includes("[") && lastPart.includes("]")) {
              const [key, indexStr] = lastPart.split("[");
              const index = parseInt(indexStr.replace("]", ""));
              console.log(`Final array access: key=${key}, index=${index}`);
              if (key && key !== "") {
                if (current[key] === undefined) {
                  console.error(`Final key '${key}' not found`);
                  throw new Error(`Invalid path: '${key}' not found`);
                }
                current = current[key];
              }
              if (isNaN(index)) {
                console.error(`Invalid array index: ${indexStr}`);
                throw new Error(`Invalid array index: ${indexStr}`);
              }
              current[index] = parsedValue;
            } else {
              if (typeof current !== "object" || current === null) {
                console.error(`Cannot set property '${lastPart}' on non-object`);
                throw new Error("Invalid path: cannot set property on non-object");
              }
              current[lastPart] = parsedValue;
            }
            console.log("Updated JSON data:", fullJsonData);
            
            // Update both the JSON store and the File store to sync left-side editor
            const updatedJsonString = JSON.stringify(fullJsonData, null, 2);
            useJson.getState().setJson(updatedJsonString);
            useFile.getState().setContents({ contents: updatedJsonString, hasChanges: true });
          }
        }
      } else {
        // If no path, replace the entire JSON
        console.log("No path - replacing entire JSON");
        const updatedJsonString = JSON.stringify(parsedValue, null, 2);
        useJson.getState().setJson(updatedJsonString);
        useFile.getState().setContents({ contents: updatedJsonString, hasChanges: true });
      }
    } catch (err) {
      console.error("Save error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Error saving changes: ${errorMessage}`);
      return;
    }

    // Success - exit edit mode and update local display immediately
    setIsEditing(false);
    setError("");
    
    // Update the local node data to show the new value immediately
    const updatedNodeData = dataToString(parsedValue);
    setLocalNodeData(updatedNodeData);
  };

>>>>>>> d0a08ee (Add inline node editing with Save/Cancel and immediate sync)
  return (
    <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
      <Stack py="sm" gap="sm">
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
<<<<<<< HEAD
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight code={nodeData} miw={350} maw={600} language="json" withCopyButton />
          </ScrollArea.Autosize>
=======
          {isEditing ? (
            <>
              <Textarea
                value={editedContent}
                onChange={event => setEditedContent(event.currentTarget.value)}
                minRows={8}
                maxRows={15}
                style={{ minWidth: 350, maxWidth: 600 }}
                autosize
              />
              {error && (
                <Text size="xs" c="red">
                  {error}
                </Text>
              )}
              <Group gap="xs">
                <Button variant="filled" color="green" size="xs" onClick={handleSave}>
                  Save
                </Button>
                <Button variant="default" size="xs" onClick={handleCancel}>
                  Cancel
                </Button>
              </Group>
            </>
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={localNodeData}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          )}
          {!isEditing && (
            <Button variant="light" size="xs" onClick={() => setIsEditing(!isEditing)}>
              Edit
            </Button>
          )}
>>>>>>> d0a08ee (Add inline node editing with Save/Cancel and immediate sync)
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
