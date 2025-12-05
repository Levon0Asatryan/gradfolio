"use client";

import {
  Stack,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import { type FC, type ReactNode, useContext, useMemo } from "react";
import { DarkModeContext } from "@/components/theme/ThemeWrapper";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LoginOutlined from "@mui/icons-material/LoginOutlined";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import IntegrationInstructionsOutlined from "@mui/icons-material/IntegrationInstructionsOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import SpaceDashboardOutlined from "@mui/icons-material/SpaceDashboardOutlined";
import TravelExploreOutlined from "@mui/icons-material/TravelExploreOutlined";
import { TypographyWithTooltip } from "@/components/text/TypographyWithTooltip";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

type AppNavigationProps = {
  collapsed?: boolean;
};

const normalize = (path: string) => {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) : path;
};

export const AppNavigation: FC<AppNavigationProps> = ({ collapsed = false }) => {
  const { mode } = useContext(DarkModeContext);
  const pathname = usePathname();

  const items: NavItem[] = useMemo(
    () => [
      { label: "Dashboard", href: "/", icon: <SpaceDashboardOutlined fontSize="small" /> },
      { label: "Auth0 Login", href: "/auth/login", icon: <LoginOutlined fontSize="small" /> },
      {
        label: "Login Connections",
        href: "/integrations/connections",
        icon: <LinkOutlined fontSize="small" />,
      },
      { label: "My Account", href: "/profile", icon: <AccountCircleOutlined fontSize="small" /> },
      { label: "Projects", href: "/projects", icon: <FolderOutlined fontSize="small" /> },
      {
        label: "Integrations",
        href: "/integrations",
        icon: <IntegrationInstructionsOutlined fontSize="small" />,
      },
      {
        label: "Explore Portfolios",
        href: "/search",
        icon: <TravelExploreOutlined fontSize="small" />,
      },
    ],
    [],
  );

  const current = normalize(pathname ?? "/");

  // Determine active navigation item by longest matching href prefix (exact match wins).
  const activeHref = useMemo(() => {
    const cur = current;
    let best = "";
    let bestLen = -1;
    for (const item of items) {
      const t = normalize(item.href);
      if (cur === t || cur.startsWith(t + "/")) {
        if (t.length > bestLen) {
          best = t;
          bestLen = t.length;
        }
      }
    }
    return best;
  }, [current, items]);

  return (
    <Stack
      width="100%"
      height="100%"
      zIndex={(theme) => theme.zIndex.drawer}
      bgcolor={(theme) => theme.palette.navigation.main}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 1.25, py: 0.75, justifyContent: collapsed ? "center" : "flex-start", height: 48 }}
      >
        <Image
          src={mode === "light" ? "/light_logo.png" : "/dark_logo.png"}
          alt="Gradfolio Logo"
          width={28}
          height={28}
        />
        {!collapsed && (
          <Typography
            variant="h6"
            color="primary"
            fontWeight="medium"
            sx={{ fontFamily: "Roboto, sans-serif" }}
          >
            Gradfolio
          </Typography>
        )}
      </Stack>

      <Divider />

      <List sx={{ py: 0 }}>
        {items.map((item) => {
          const button = (
            <ListItemButton
              component={Link}
              href={item.href}
              selected={normalize(item.href) === activeHref}
              sx={(theme) => ({
                px: 1.75,
                minHeight: 48,
                justifyContent: collapsed ? "center" : "flex-start",
                color: theme.palette.text.secondary,
                "& .MuiListItemIcon-root": {
                  minWidth: collapsed ? 0 : "auto",
                  mr: collapsed ? 0 : 1,
                  color: "inherit",
                },
                "& .MuiListItemIcon-root svg": {
                  fontSize: 20,
                },
                "&.Mui-selected": {
                  backgroundColor: theme.palette.action.selected,
                  "&:hover": {
                    backgroundColor: theme.palette.action.selected,
                  },
                },
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              })}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              {!collapsed && (
                <TypographyWithTooltip variant="inherit" placement="right" title={item.label} />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.href} disablePadding>
              {collapsed ? (
                <Tooltip title={item.label} placement="right">
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </ListItem>
          );
        })}
      </List>
    </Stack>
  );
};
