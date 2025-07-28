// TextEditor.tsx

import React, { useCallback, useRef } from "react";
import { LoadingOverlay } from "@mantine/core";
import styled from "styled-components";
import Editor, { type EditorProps, loader, type OnMount, useMonaco } from "@monaco-editor/react";
import useConfig from "../../store/useConfig";
import useFile from "../../store/useFile";

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
  const monaco = useMonaco();
  const contents = useFile((state) => state.contents);
  const setContents = useFile((state) => state.setContents);
  const setError = useFile((state) => state.setError);
  const jsonSchema = useFile((state) => state.jsonSchema);
  const getHasChanges = useFile((state) => state.getHasChanges);
  const theme = useConfig((state) => (state.darkmodeEnabled ? "vs-dark" : "light"));
  const fileType = useFile((state) => state.format);

  const editorRef = useRef<any>(null);

  React.useEffect(() => {
    console.log("[TextEditor] monaco available: ", !!monaco);
    if (monaco) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: true,
        enableSchemaRequest: true,
        ...(jsonSchema && {
          schemas: [
            {
              uri: "http://myserver/foo-schema.json",
              fileMatch: ["*"],
              schema: jsonSchema,
            },
          ],
        }),
      });
      console.log("[TextEditor] schema set: ", jsonSchema);
    }
  }, [jsonSchema, monaco]);

  React.useEffect(() => {
    const beforeunload = (e: BeforeUnloadEvent) => {
      if (getHasChanges()) {
        const confirmationMessage =
          "Unsaved changes, if you leave before saving your changes will be lost";
        (e || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
      }
    };
    window.addEventListener("beforeunload", beforeunload);
    return () => window.removeEventListener("beforeunload", beforeunload);
  }, [getHasChanges]);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    console.log("[TextEditor] Editor mounted");
    editor.onDidPaste(() => {
      console.log("[TextEditor] Paste detected, formatting document");
      editor.getAction("editor.action.formatDocument")?.run();
    });
  }, []);

  // Sync external updates into editor
  React.useEffect(() => {
    console.log("[TextEditor] contents changed: ", contents);
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const current = model.getValue();
        console.log("[TextEditor] model value: ", current);
        if (current !== contents) {
          console.log("[TextEditor] Updating model value to store contents");
          model.setValue(contents);
        }
      }
    }
  }, [contents]);

  return (
    <StyledEditorWrapper>
      <StyledWrapper>
        <Editor
          height="100%"
          language={fileType}
          theme={theme}
          value={contents}
          options={editorOptions}
          onMount={handleMount}
          onValidate={(errors) => {
            console.log("[TextEditor] validation errors:", errors);
            setError(errors[0]?.message);
          }}
          onChange={(value) => {
            console.log("[TextEditor] onChange value:", value);
            setContents({ contents: value ?? "", skipUpdate: true });
          }}
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
