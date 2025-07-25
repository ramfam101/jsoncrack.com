import React from "react";
import type { ModalProps } from "@mantine/core";
import { Stack, Modal, Button, Text, Anchor, Group, TextInput } from "@mantine/core";
import { VscLinkExternal } from "react-icons/vsc";
import useFile from "../../../store/useFile";

export const JQModal = ({ opened, onClose }: ModalProps) => {
  const [query, setQuery] = React.useState("");

  const updateJson = (query, onClose) => {
    const json = useFile.getState().contents;
    const result = runJQ(query, json); // Assume runJQ is your jq processor
    useFile.getState().setContents(result);
    onClose();
  };

  return (
    <Modal title="JSON Query" size="lg" opened={opened} onClose={onClose} centered>
      <Stack>
        <Text fz="sm">
          jq is a lightweight and flexible command-line JSON processor. JSON Crack uses simplified
          version of jq, not all features are supported.
          <br />
          <Anchor
            fz="sm"
            target="_blank"
            href="https://jqlang.github.io/jq/manual/"
            rel="noopener noreferrer"
          >
            Read documentation. <VscLinkExternal />
          </Anchor>
        </Text>
        <TextInput
          leftSection="jq"
          placeholder="Enter jq query"
          value={query}
          onChange={e => setQuery(e.currentTarget.value)}
        />
        <Group justify="right">
          <Button onClick={() => updateJson(query, onClose)}>Display on Graph</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
