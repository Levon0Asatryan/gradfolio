"use client";

import { type FC, Fragment, type ReactNode, useContext, useRef } from "react";
import {
  type ImperativePanelGroupHandle,
  type ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { COMPONENT_ID } from "@/components/sidebar/utils/constants/constants";
import { useTheme, Divider, IconButton, Tooltip } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { DarkModeContext } from "@/components/theme/ThemeWrapper";
import { useLayoutConfigHook } from "@/utils/hooks/useLayoutConfigHook";

interface SideBarWrapperProps {
  children: ReactNode;
}

export const SideBarWrapper: FC<SideBarWrapperProps> = ({ children }) => {
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const sideBarRef = useRef<ImperativePanelHandle>(null);

  const { min, max, collapsedSize } = useLayoutConfigHook();

  const theme = useTheme();
  const { mode, toggleMode } = useContext(DarkModeContext);

  return (
    <Fragment>
      <PanelGroup
        ref={panelGroupRef}
        direction="horizontal"
        autoSaveId={COMPONENT_ID.MAIN_NAVIGATION}
        style={{ height: "100vh", backgroundColor: theme.palette.background.default }}
      >
        <Panel
          id={COMPONENT_ID.MAIN_NAVIGATION}
          order={1}
          collapsible
          minSize={min}
          maxSize={max}
          ref={sideBarRef}
          defaultSize={min}
          collapsedSize={collapsedSize}
          style={{ zIndex: theme.zIndex.drawer }}
        ></Panel>

        <PanelResizeHandle>
          <Divider orientation="vertical" />
        </PanelResizeHandle>

        <Panel id={COMPONENT_ID.CONTENT_WRAPPER} order={2}>
          {children}
        </Panel>
      </PanelGroup>

      <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
        <IconButton
          aria-label="toggle dark mode"
          onClick={toggleMode}
          sx={{
            position: "fixed",
            top: 8,
            right: 8,
            zIndex: (theme) => theme.zIndex.modal + 1,
            bgcolor: (theme) => theme.palette.background.paper,
            color: (theme) => theme.palette.text.primary,
            boxShadow: 2,
            "&:hover": { bgcolor: (theme) => theme.palette.action.hover },
          }}
          size="small"
        >
          {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Fragment>
  );
};
