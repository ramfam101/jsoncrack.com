import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

const dataToString = (data: any) => {
    return JSON.stringify(data, null, 2);
};


export const NodeModal = ({ opened, onClose }: ModalProps) => {
    const rawData = useGraph(state => state.selectedNode?.text);
    const nodeData = dataToString(rawData);
    const path = useGraph(state => state.selectedNode?.path || "");

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(nodeData);

    useEffect(() => {
        setEditValue(nodeData);
    }, [nodeData]);

    const handleSave = () => {
        try {
            console.log("editValue raw:", editValue);
            const parsed = JSON.parse(editValue);
            console.log("Parsed JSON:", parsed);

            const currentJson = structuredClone(useJson.getState().json);
            const pathParts = path.split(".");
            let cursor: any = currentJson;
            for (let i = 0; i < pathParts.length - 1; i++) {
                cursor = cursor[pathParts[i]];
            }
            cursor[pathParts[pathParts.length - 1]] = parsed;

            useJson.getState().setJson(currentJson);
            useGraph.getState().setSelectedNode({ path, text: parsed });

            setIsEditing(false);
        } catch (e) {
            console.error("JSON parse error:", e);
            alert("Invalid JSON format");
        }
    };



    const handleCancel = () => {
        setIsEditing(false);
        setEditValue(nodeData);
    };

    return (
        <Modal title="Node Content" size="auto" opened={opened} onClose={onClose} centered>
            <Stack py="sm" gap="sm">
                <Stack gap="xs">
                    <Text fz="xs" fw={500}>
                        Content
          </Text>

                    {!isEditing ? (
                        <ScrollArea.Autosize mah={250} maw={600}>
                            <CodeHighlight
                                code={nodeData}
                                miw={350}
                                maw={600}
                                language="json"
                                withCopyButton
                            />
                        </ScrollArea.Autosize>
                    ) : (
                            <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                style={{
                                    width: "100%",
                                    minHeight: "150px",
                                    fontFamily: "monospace",
                                    padding: "10px",
                                }}
                            />
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


                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-start",
                        paddingTop: "10px",
                        flexWrap: "wrap",
                    }}
                >
                    {!isEditing ? (
                        <Button
                            variant="filled"
                            onClick={() => {
                                console.log("Edit button clicked");
                                setIsEditing(true);
                            }}
                        >
                            Edit
                        </Button>
                    ) : (
                            <>
                                <Button
                                    color="green"
                                    variant="filled"
                                    onClick={() => {
                                        console.log("Save button clicked");
                                        handleSave();
                                    }}
                                >
                                    Save
    </Button>
                                <Button
                                    color="red"
                                    variant="filled"
                                    onClick={() => {
                                        console.log("Cancel button clicked");
                                        handleCancel();
                                    }}
                                >
                                    Cancel
    </Button>
                            </>
                        )}

                </div>
            </Stack>
        </Modal>
    );
};