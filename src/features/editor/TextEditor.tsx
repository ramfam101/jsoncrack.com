import React, { useCallback } from "react";
import { LoadingOverlay } from "@mantine/core";
import styled from "styled-components";
import Editor, { type EditorProps, loader, type OnMount, useMonaco } from "@monaco-editor/react";
import useConfig from "../../store/useConfig";
import useFile from "../../store/useFile";
import useJson from "../../store/useJson";

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

const TextEditor = () => {
  const monacoInstance = useMonaco();
  const jsonValue = useJson(state => state.json);
  const setErrorMsg = useFile(state => state.setError);
  const schema = useFile(state => state.jsonSchema);
  const themeMode = useConfig(state => (state.darkmodeEnabled ? "vs-dark" : "light"));
  const formatType = useFile(state => state.format);

  React.useEffect(() => {
    if (monacoInstance) {
      monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: true,
        enableSchemaRequest: true,
        ...(schema && {
          schemas: [
            {
              uri: "http://myserver/foo-schema.json",
              fileMatch: ["*"],
              schema,
            },
          ],
        }),
      });
    }
  }, [schema, monacoInstance]);

  const handleEditorMount: OnMount = useCallback(editor => {
    editor.onDidPaste(() => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  }, []);

  return (
    <StyledEditorWrapper>
      <StyledWrapper>
        <Editor
          height="100%"
          language={formatType === "json" ? "json" : formatType}
          theme={themeMode}
          value={jsonValue}
          key={jsonValue}
          options={editorOptions}
          onMount={handleEditorMount}
          onValidate={errors => setErrorMsg(errors[0]?.message)}
          loading={<LoadingOverlay visible />}
        />
      </StyledWrapper>
    </StyledEditorWrapper>
  );
};

export default TextEditor;

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
