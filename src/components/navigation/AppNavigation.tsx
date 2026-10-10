"use client";

import { type FC, useMemo, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { BrandLogo } from "@/components/brand/BrandLogo";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { usePathname } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRight from "@mui/icons-material/KeyboardDoubleArrowRight";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { safeHttpUrl } from "@/utils/helpers/safeHttpUrl";
import { NotificationsPopoverButton } from "@/components/notifications/NotificationsBell";
import { NavLink } from "./NavLink";
import { activeHref, isActive, navItems } from "./navItems";
import { type NavMode, pickByMode, writeNavMode } from "./navMode";

/** The signed-in user, from the session the layout read on the server. */
export interface NavUser {
  name: string;
  picture?: string;
}

/** Wide enough for "Ինտեգրացիաներ" and "Կարգավորումներ" (Armenian) on one line at 11px, bold. */
const RAIL_WIDTH = 124;

/**
 * The sidebar from `sm` up: icon, label and user card from `lg`; below that an
 * icon-over-label rail. Labels wrap instead of truncating (ru and am run long).
 * On a phone `PhoneNavigation` takes over (this one is `display: none` there).
 */
export const AppNavigation: FC<{ user?: NavUser | null; initialMode?: NavMode }> = ({
  user = null,
  initialMode,
}) => {
  const { t } = useLanguage();
  const theme = useTheme();
  // A stored choice (the cookie, read on the server) wins at every width from `sm`;
  // without one the width decides, so the first paint needs no script.
  const [mode, setMode] = useState<NavMode | undefined>(initialMode);
  const wide = useMediaQuery(theme.breakpoints.up("lg"), { defaultMatches: true });
  const expanded = mode ? mode === "full" : wide;
  const toggle = () => {
    const next: NavMode = expanded ? "rail" : "full";
    setMode(next);
    writeNavMode(next);
  };
  const pick = <T,>(rail: T, full: T) => pickByMode(mode, rail, full);
  const pathname = usePathname();
  const items = useMemo(() => navItems(t, user !== null), [t, user]);
  const active = activeHref(pathname, items);

  return (
    <Box
      component="nav"
      aria-label={t.common.mainMenu}
      sx={(theme) => ({
        display: { xs: "none", sm: "flex" },
        flexDirection: "column",
        gap: 0.75,
        flex: "none",
        width: pick(RAIL_WIDTH, 248),
        transition: theme.transitions.create("width", { duration: 200 }),
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        px: pick(1, 1.5),
        py: 2.25,
        bgcolor: theme.palette.navigation.main,
        borderRight: `1px solid ${theme.palette.surface.line}`,
      })}
    >
      <Stack
        alignItems="center"
        spacing={1}
        sx={{
          flexDirection: pick("column", "row"),
          px: pick(0, 1.25),
          pb: 1.75,
          justifyContent: pick("center", "space-between"),
        }}
      >
        <Box sx={{ display: pick("block", "none"), lineHeight: 0 }}>
          <BrandLogo variant="mark" height={36} />
        </Box>
        <Box sx={{ display: pick("none", "block"), lineHeight: 0 }}>
          <BrandLogo height={32} />
        </Box>
        <Tooltip title={expanded ? t.common.collapseSidebar : t.common.expandSidebar}>
          <IconButton
            onClick={toggle}
            aria-label={t.common.sidebar}
            aria-expanded={expanded}
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <Box component="span" sx={{ display: pick("none", "inline-flex"), lineHeight: 0 }}>
              <KeyboardDoubleArrowLeft fontSize="small" />
            </Box>
            <Box component="span" sx={{ display: pick("inline-flex", "none"), lineHeight: 0 }}>
              <KeyboardDoubleArrowRight fontSize="small" />
            </Box>
          </IconButton>
        </Tooltip>
      </Stack>

      {items.map((item) => {
        const current = isActive(item.href, active);
        return (
          <NavLink
            key={item.href}
            href={item.href}
            current={current}
            fullLoad={item.fullLoad}
            sx={(theme) => ({
              display: "flex",
              flexDirection: pick("column", "row"),
              alignItems: "center",
              justifyContent: pick("center", "flex-start"),
              gap: pick(0.5, 1.5),
              width: "100%",
              minHeight: 44,
              px: pick(0.25, 1.75),
              py: pick(1, 1.25),
              borderRadius: "14px",
              textAlign: pick("center", "left"),
              fontWeight: 700,
              fontSize: pick("0.75rem", "0.9375rem"),
              lineHeight: 1.25,
              color: current ? theme.palette.primary.contrastText : theme.palette.text.primary,
              backgroundImage: current ? theme.palette.surface.gradient : "none",
              "&:hover": { bgcolor: current ? undefined : theme.palette.surface.soft },
              "& svg": { fontSize: 22, flex: "none" },
              "& .nav-label": { minWidth: 0, overflowWrap: "break-word" },
              // Armenian words are long: a size down keeps them whole in the rail.
              "html[lang='hy'] & .nav-label": { fontSize: pick("0.6875rem", "0.9375rem") },
            })}
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </NavLink>
        );
      })}

      <Box sx={{ flex: 1, minHeight: 12 }} />

      {user && (
        <NotificationsPopoverButton
          sx={(theme) => ({
            display: "flex",
            flexDirection: pick("column", "row"),
            alignItems: "center",
            justifyContent: pick("center", "flex-start"),
            gap: pick(0.5, 1.5),
            width: "100%",
            minHeight: 44,
            px: pick(0.25, 1.75),
            py: pick(1, 1.25),
            borderRadius: "14px",
            textAlign: pick("center", "left"),
            fontWeight: 700,
            fontSize: pick("0.75rem", "0.9375rem"),
            lineHeight: 1.25,
            color: theme.palette.text.primary,
            "&:hover": { bgcolor: theme.palette.surface.soft },
            "& svg": { fontSize: 22, flex: "none" },
            "& .nav-label": { minWidth: 0, overflowWrap: "break-word" },
            "html[lang='hy'] & .nav-label": { fontSize: pick("0.6875rem", "0.9375rem") },
          })}
        />
      )}

      {user && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          data-testid="nav-user"
          sx={(theme) => ({
            p: 1.5,
            borderRadius: "14px",
            bgcolor: theme.palette.surface.soft,
            justifyContent: pick("center", "flex-start"),
          })}
        >
          <Avatar
            src={safeHttpUrl(user.picture)}
            alt=""
            sx={{
              width: 36,
              height: 36,
              fontSize: 14,
              backgroundImage: (th) => th.palette.surface.gradient,
            }}
          >
            {user.name.trim().charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            variant="subtitle2"
            sx={{ display: pick("none", "block"), minWidth: 0, overflowWrap: "anywhere" }}
          >
            {user.name}
          </Typography>
        </Stack>
      )}
      {user && (
        <NavLink
          // A full page load: /auth/logout clears the session and redirects through Auth0.
          href="/auth/logout"
          sx={(theme) => ({
            display: "flex",
            flexDirection: pick("column", "row"),
            alignItems: "center",
            justifyContent: pick("center", "flex-start"),
            gap: pick(0.5, 1.5),
            minHeight: 44,
            px: pick(0.5, 1.75),
            borderRadius: "14px",
            fontWeight: 700,
            fontSize: pick("0.75rem", "0.9375rem"),
            color: theme.palette.text.secondary,
            "&:hover": { bgcolor: theme.palette.surface.soft },
            "& svg": { fontSize: 22 },
          })}
        >
          <LogoutOutlined />
          <span className="nav-label">{t.common.logout}</span>
        </NavLink>
      )}
    </Box>
  );
};
