import React, { useCallback } from "react";
import { LoadingOverlay } from "@mantine/core";
import styled from "styled-components";
import Editor, { type EditorProps, loader, type OnMount, useMonaco } from "@monaco-editor/react";
import useConfig from "../../store/useConfig";
import { useFile } from "../../store/useFile";

loader.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs",
  },
});

const customEditorSettings: EditorProps["options"] = {
  formatOnPaste: true,
  tabSize: 2,
  formatOnType: true,
  minimap: { enabled: false },
  stickyScroll: { enabled: false },
  scrollBeyondLastLine: false,
  placeholder: "Start typing...",
};

const CustomTextEditorComponent = () => {
  const monacoInstance = useMonaco();
  const fileContent = useFile(store => store.contents);
  const updateFileContent = useFile(store => store.updateFileContent);
  const updateError = useFile(store => store.updateError);
  const schemaForJson = useFile(store => store.jsonSchema);
  const hasChanges = useFile(store => store.hasChanges);
  const editorTheme = useConfig(store => (store.darkmodeEnabled ? "vs-dark" : "light"));
  const fileFormatType = useFile(store => store.format);

  React.useEffect(() => {
    monacoInstance?.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      enableSchemaRequest: true,
      ...(schemaForJson && {
        schemas: [
          {
            uri: "http://myserver/foo-schema.json",
            fileMatch: ["*"],
            schema: schemaForJson,
          },
        ],
      }),
    });
  }, [schemaForJson, monacoInstance?.languages.json.jsonDefaults]);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        const warningMsg =
          "Unsaved changes, if you leave before saving your changes will be lost";
        (event || window.event).returnValue = warningMsg;
        return warningMsg;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  const onEditorMount: OnMount = useCallback(editorInstance => {
    editorInstance.onDidPaste(() => {
      editorInstance.getAction("editor.action.formatDocument")?.run();
    });
  }, []);

  return (
    <StyledEditorWrapper>
      <StyledWrapper>
        <Editor
          height="100%"
          language={fileFormatType}
          theme={editorTheme}
          value={fileContent}
          options={customEditorSettings}
          onMount={onEditorMount}
          onValidate={errors => updateError(errors[0]?.message || null)}
          onChange={contentValue => updateFileContent({ contents: contentValue, skipUpdate: true })}
          loading={<LoadingOverlay visible />}
        />
      </StyledWrapper>
    </StyledEditorWrapper>
  );
};

export default CustomTextEditorComponent;

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
