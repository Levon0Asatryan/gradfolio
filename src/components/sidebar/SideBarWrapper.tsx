"use client";

import { type FC, type ReactNode } from "react";
import Box from "@mui/material/Box";
import { AppNavigation, type NavUser } from "@/components/navigation/AppNavigation";
import { PHONE_BAR_HEIGHT, PhoneNavigation } from "@/components/navigation/PhoneNavigation";
import { useSidebarVisibility } from "@/components/layout/SidebarVisibilityContext";
import type { NavMode } from "@/components/navigation/navMode";
import { MAIN_ID } from "@/components/layout/SkipLink";

interface SideBarWrapperProps {
  children: ReactNode;
  /** The signed-in user, or null for a visitor (read by the layout). */
  user?: NavUser | null;
  /** The stored sidebar choice (cookie read by the layout), if any. */
  initialNav?: NavMode;
}

/**
 * The page frame: navigation (sidebar or rail from `sm`, bottom bar on a phone) and the
 * page in the one `<main>`. Server-rendered: no client-only branch, so there is
 * no blank first paint and no layout jump. A page can hide the navigation (404).
 */
export const SideBarWrapper: FC<SideBarWrapperProps> = ({ children, user = null, initialNav }) => {
  const { hidden } = useSidebarVisibility();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {!hidden && <AppNavigation user={user} initialMode={initialNav} />}
      <Box
        component="main"
        id={MAIN_ID}
        tabIndex={-1}
        sx={{
          flex: 1,
          minWidth: 0,
          color: "text.primary",
          pb: hidden
            ? 0
            : { xs: `calc(${PHONE_BAR_HEIGHT + 8}px + env(safe-area-inset-bottom, 0px))`, sm: 0 },
        }}
      >
        {children}
      </Box>
      {!hidden && <PhoneNavigation user={user} />}
    </Box>
  );
};
