"use client";

import { type FC, Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import {
  type ImperativePanelGroupHandle,
  type ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { COMPONENT_ID } from "@/components/sidebar/utils/constants/constants";
import { useTheme, Divider, useMediaQuery } from "@mui/material";

import {
  navbarCollapsedDefaultSize,
  useLayoutConfigHook,
} from "@/components/sidebar/utils/hooks/useLayoutConfigHook";
import { AppNavigation } from "@/components/navigation/AppNavigation";
import { useSidebarVisibility } from "@/components/layout/SidebarVisibilityContext";

interface SideBarWrapperProps {
  children: ReactNode;
}

export const SideBarWrapper: FC<SideBarWrapperProps> = ({ children }) => {
  const { hidden } = useSidebarVisibility();
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const sideBarRef = useRef<ImperativePanelHandle>(null);

  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { collapsedSize, min, max } = useLayoutConfigHook(navbarCollapsedDefaultSize, 160, 280);
  const safeCollapsedSize = collapsedSize ?? 4;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
      try {
        (sideBarRef.current as any)?.setSize?.(safeCollapsedSize);
      } catch {}
      return;
    }
    const size =
      sideBarRef.current && (sideBarRef.current as any).getSize
        ? (sideBarRef.current as any).getSize()
        : undefined;
    if (typeof size === "number") {
      setIsCollapsed(size <= safeCollapsedSize + 0.01);
    }
  }, [safeCollapsedSize, isMobile]);

  if (!mounted) {
    // In hidden mode we can render immediately to avoid layout shift
    if (hidden) {
      return (
        <Fragment>
          <div style={{ minHeight: "100vh" }}>{children}</div>
        </Fragment>
      );
    }
    return null;
  }

  if (hidden) {
    return (
      <Fragment>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
          }}
        >
          {children}
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PanelGroup
        ref={panelGroupRef}
        direction="horizontal"
        autoSaveId={COMPONENT_ID.MAIN_NAVIGATION}
        style={{ height: "100vh", backgroundColor: theme.palette.background.default }}
        onLayout={(sizes: number[]) => {
          if (isMobile) {
            setIsCollapsed(true);
            return;
          }
          const first = sizes && sizes.length ? sizes[0] : undefined;
          if (typeof first === "number") {
            setIsCollapsed(first <= safeCollapsedSize + 0.01);
          }
        }}
      >
        <Panel
          id={COMPONENT_ID.MAIN_NAVIGATION}
          collapsible
          order={1}
          minSize={isMobile ? safeCollapsedSize : min}
          maxSize={isMobile ? safeCollapsedSize : max}
          ref={sideBarRef}
          defaultSize={isMobile ? safeCollapsedSize : min}
          collapsedSize={safeCollapsedSize}
          onResize={(size: number) => {
            if (isMobile) {
              setIsCollapsed(true);
              return;
            }
            setIsCollapsed(size <= safeCollapsedSize + 0.01);
          }}
          style={{ zIndex: theme.zIndex.drawer }}
        >
          <AppNavigation collapsed={isMobile || isCollapsed} />
        </Panel>

        {!isMobile && (
          <PanelResizeHandle>
            <Divider orientation="vertical" />
          </PanelResizeHandle>
        )}

        <Panel
          id={COMPONENT_ID.CONTENT_WRAPPER}
          order={2}
          style={{
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            // Allow page content to scroll within the content panel
            overflowY: "auto",
            // Required so flex children can shrink and scrolling can occur
            minHeight: 0,
          }}
        >
          {children}
        </Panel>
      </PanelGroup>
    </Fragment>
  );
};
