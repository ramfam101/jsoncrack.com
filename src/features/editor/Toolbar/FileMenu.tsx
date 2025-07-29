import React from "react";
import { Flex, Menu } from "@mantine/core";
import { event as gaEvent } from "nextjs-google-analytics";
import { CgChevronDown } from "react-icons/cg";
import useFile from "../../../store/useFile";
import { useModal } from "../../../store/useModal";
import { StyledToolElement } from "./styles";

export const FileMenu = () => {
  const setVisible = useModal(state => state.setVisible);
  const getContents = useFile(state => state.getContents);
  const getFormat = useFile(state => state.getFormat);

const handleSave = () => {
  const a = document.createElement("a");
  const file = new Blob([getContents()], { type: "text/plain" });

  const url = window.URL.createObjectURL(file);
  a.href = url;
  a.download = `jsoncrack.${getFormat()}`;
  a.click();

  window.URL.revokeObjectURL(url); // Clean up

  gaEvent("save_file", { label: getFormat() });
  };

  return (
    <Menu shadow="md" withArrow>
      <Menu.Target>
        <StyledToolElement title="File">
          <Flex align="center" gap={3}>
            File
            <CgChevronDown />
          </Flex>
        </StyledToolElement>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item fz={12} onClick={() => setVisible("ImportModal", true)}>
          Import
        </Menu.Item>
        <Menu.Item fz={12} onClick={handleSave}>
          Export
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
