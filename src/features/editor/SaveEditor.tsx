import React, { useCallback } from "react";
import { LoadingOverlay } from "@mantine/core";
import styled from "styled-components";
import Editor, { type EditorProps, loader, type OnMount, useMonaco } from "@monaco-editor/react";
import useConfig from "../../store/useConfig";
import useFile from "../../store/useFile";
import useGraph from "./views/GraphView/stores/useGraph";

loader.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs",
  },
});

const editorOptions: EditorProps["options"] = {
  formatOnPaste: true,
  tabSize: 2,
  formatOnType: true,
  minimap: { enabled: false },
  stickyScroll: { enabled: false },
  scrollBeyondLastLine: false,
  placeholder: "Start typing...",
};

interface SaveEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: string;
  language: string;
}

const SaveEditor = ({ value, onChange, theme, language }: SaveEditorProps) => {
  const monaco = useMonaco();

  const editorOptions: EditorProps["options"] = {
    formatOnPaste: true,
    tabSize: 2,
    formatOnType: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
  };

  const handleMount: OnMount = useCallback(editor => {
    editor.onDidPaste(() => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  }, []);

  return (
    <StyledEditorWrapper>
      <StyledWrapper>
        <Editor
          height="300px"
          language={language}
          theme={theme}
          value={value}
          onChange={val => onChange(val ?? "")}
          options={editorOptions}
          onMount={handleMount}
          loading={<LoadingOverlay visible />}
        />
      </StyledWrapper>
    </StyledEditorWrapper>
  );
};

export default SaveEditor; 

const StyledEditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: none;
`;

const StyledWrapper = styled.div`
  display: grid;
  height: calc(100vh - 67px);
  grid-template-columns: 100%;
  grid-template-rows: minmax(0, 1fr);
`;
