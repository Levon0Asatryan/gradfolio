"use client";

import { type FC, type ReactNode, useRef } from "react";
import {
  type ImperativePanelGroupHandle,
  type ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { COMPONENT_ID } from "@/components/sidebar/utils/constants/constants";
import { grey } from "@mui/material/colors";
import { useTheme, Divider } from "@mui/material";

interface SideBarWrapperProps {
  children: ReactNode;
}

export const SideBarWrapper: FC<SideBarWrapperProps> = ({ children }) => {
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const sideBarRef = useRef<ImperativePanelHandle>(null);

  const theme = useTheme();

  return (
    <PanelGroup
      ref={panelGroupRef}
      direction="horizontal"
      autoSaveId={COMPONENT_ID.MAIN_NAVIGATION}
      style={{ height: "100vh", backgroundColor: grey[50] }}
    >
      <Panel
        id={COMPONENT_ID.MAIN_NAVIGATION}
        order={1}
        collapsible
        minSize={10}
        ref={sideBarRef}
        defaultSize={10}
        collapsedSize={2}
        style={{ zIndex: theme.zIndex.drawer }}
        maxSize={15}
      ></Panel>

      <PanelResizeHandle>
        <Divider orientation="vertical" />
      </PanelResizeHandle>

      <Panel id={COMPONENT_ID.CONTENT_WRAPPER} order={2}>
        {children}
      </Panel>
    </PanelGroup>
  );
};
