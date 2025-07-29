import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useMantineColorScheme } from "@mantine/core";
import "@mantine/dropzone/styles.css";
import styled, { ThemeProvider as CustomThemeProvider } from "styled-components";
import { QueryClient as CustomQueryClient, QueryClientProvider as CustomQueryClientProvider } from "@tanstack/react-query";
import { Allotment as CustomAllotment } from "allotment";
import "allotment/dist/style.css";
// import Cookie from "js-cookie";
import { NextSeo as CustomNextSeo } from "next-seo";
import { SEO as CustomSEO } from "../constants/seo";
import { darkTheme as customDarkTheme, lightTheme as customLightTheme } from "../constants/theme";
import { BottomBar as CustomBottomBar } from "../features/editor/BottomBar";
import { FullscreenDropzone as CustomFullscreenDropzone } from "../features/editor/FullscreenDropzone";
import { Toolbar as CustomToolbar } from "../features/editor/Toolbar";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";
import useConfig from "../store/useConfig";
import { useFile } from "../store/useFile";

const CustomModalController = dynamic(() => import("../features/modals/ModalController"));
const CustomExternalMode = dynamic(() => import("../features/editor/ExternalMode"));

const customQueryClientInstance = new CustomQueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export const CustomStyledPageWrapper = styled.div`
  height: calc(100vh - 27px);
  width: 100%;

  @media only screen and (max-width: 320px) {
    height: 100vh;
  }
`;

export const CustomStyledEditorWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

export const CustomStyledEditor = styled(CustomAllotment)`
  position: relative !important;
  display: flex;
  background: ${({ theme }) => theme.BACKGROUND_SECONDARY};
  height: calc(100vh - 67px);

  @media only screen and (max-width: 320px) {
    height: 100vh;
  }
`;


const CustomTextEditor = dynamic(() => import("../features/editor/TextEditor"), {
  ssr: false,
});

const CustomLiveEditor = dynamic(() => import("../features/editor/LiveEditor"), {
  ssr: false,
});

const CustomEditorPage = () => {
  const { query, isReady } = useRouter();
  const { setColorScheme } = useMantineColorScheme();
  const checkEditorSession = useFile(state => state.checkEditorSession);
  const darkmodeEnabled = useConfig(state => state.darkmodeEnabled);
  const fullscreen = useGraph(state => state.fullscreen);

  useEffect(() => {
    if (isReady) checkEditorSession(query?.json);
  }, [checkEditorSession, isReady, query]);

  useEffect(() => {
    setColorScheme(darkmodeEnabled ? "dark" : "light");
  }, [darkmodeEnabled, setColorScheme]);

  return (
    <>
      <CustomNextSeo
        {...CustomSEO}
        title="Editor | JSON Crack"
        description="JSON Crack Editor is a tool for visualizing into graphs, analyzing, editing, formatting, querying, transforming and validating JSON, CSV, YAML, XML, and more."
        canonical="https://jsoncrack.com/editor"
      />
      <CustomThemeProvider theme={darkmodeEnabled ? customDarkTheme : customLightTheme}>
        <CustomQueryClientProvider client={customQueryClientInstance}>
          <CustomExternalMode />
          <CustomModalController />
          <CustomStyledEditorWrapper>
            <CustomStyledPageWrapper>
              <CustomToolbar />
              <CustomStyledEditorWrapper>
                <CustomStyledEditor proportionalLayout={false}>
                  <CustomAllotment.Pane
                    preferredSize={450}
                    minSize={fullscreen ? 0 : 300}
                    maxSize={800}
                    visible={!fullscreen}
                  >
                    <CustomTextEditor />
                  </CustomAllotment.Pane>
                  <CustomAllotment.Pane minSize={0}>
                    <CustomLiveEditor />
                  </CustomAllotment.Pane>
                </CustomStyledEditor>
                <CustomFullscreenDropzone />
              </CustomStyledEditorWrapper>
            </CustomStyledPageWrapper>
            <CustomBottomBar />
          </CustomStyledEditorWrapper>
        </CustomQueryClientProvider>
      </CustomThemeProvider>
    </>
  );
};

export default CustomEditorPage;
