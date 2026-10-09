"use client";

import { type FC, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import { usePathname } from "next/navigation";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import MoreHorizOutlined from "@mui/icons-material/MoreHorizOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { SxProps, Theme } from "@mui/material/styles";
import type { NavUser } from "./AppNavigation";
import Badge from "@mui/material/Badge";
import {
  BellIcon,
  NotificationsSheet,
  useBellLabel,
} from "@/components/notifications/NotificationsBell";
import { useNotifications } from "@/components/notifications/NotificationsProvider";
import { NavLink } from "./NavLink";
import { activeHref, isActive, navItems } from "./navItems";

/** The bar's height without the device's bottom inset; the layout pads the page by it. */
export const PHONE_BAR_HEIGHT = 64;

const pill =
  (current: boolean): SxProps<Theme> =>
  (theme) => ({
    display: "grid",
    placeItems: "center",
    width: 48,
    height: 28,
    borderRadius: "14px",
    color: current ? theme.palette.primary.contrastText : "inherit",
    backgroundImage: current ? theme.palette.surface.gradient : "none",
    "& svg": { fontSize: 22 },
  });

/**
 * Phone navigation: a bottom bar with the four main places and "More", which
 * opens a sheet with the rest (and log out). From `sm` up the sidebar is used.
 */
export const PhoneNavigation: FC<{ user?: NavUser | null }> = ({ user = null }) => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const [bell, setBell] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const { count } = useNotifications();
  const bellLabel = useBellLabel();
  const items = useMemo(() => navItems(t, user !== null), [t, user]);
  const active = activeHref(pathname, items);
  const primary = items.filter((i) => i.primary);
  const rest = items.filter((i) => !i.primary);
  const moreActive = rest.some((i) => isActive(i.href, active));

  // Navigating closes the sheet.
  useEffect(() => {
    setMore(false);
    setBell(false);
  }, [pathname]);

  const labelSx = {
    fontSize: "0.6875rem",
    fontWeight: 700,
    lineHeight: 1.15,
    textAlign: "center",
  } as const;

  return (
    <>
      <Box
        component="nav"
        aria-label={t.common.mainMenu}
        sx={(theme) => ({
          display: { xs: "grid", sm: "none" },
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "2px",
          position: "fixed",
          insetInline: 0,
          bottom: 0,
          zIndex: theme.zIndex.appBar,
          px: 0.75,
          pt: 0.75,
          pb: "calc(6px + env(safe-area-inset-bottom, 0px))",
          bgcolor: theme.palette.navigation.main,
          borderTop: `1px solid ${theme.palette.surface.line}`,
        })}
      >
        {primary.map((item) => {
          const current = isActive(item.href, active);
          return (
            <NavLink
              key={item.href}
              href={item.href}
              current={current}
              sx={{
                flexDirection: "column",
                gap: 0.375,
                minHeight: 56,
                borderRadius: "14px",
                color: current ? "primary.main" : "text.primary",
                alignItems: "center",
                justifyContent: "flex-start",
                px: 0.25,
                py: 0.5,
              }}
            >
              <Box component="span" sx={pill(current)}>
                {item.icon}
              </Box>
              <Box
                component="span"
                sx={{
                  ...labelSx,
                  overflowWrap: "break-word",
                  "html[lang='hy'] &": { fontSize: "0.625rem" },
                }}
              >
                {item.label}
              </Box>
            </NavLink>
          );
        })}
        <ButtonBase
          ref={moreButton}
          onClick={() => setMore(true)}
          aria-haspopup="dialog"
          aria-expanded={more}
          aria-label={user && count ? `${t.common.more}, ${bellLabel}` : undefined}
          sx={{
            flexDirection: "column",
            gap: 0.375,
            minHeight: 56,
            borderRadius: "14px",
            color: moreActive ? "primary.main" : "text.primary",
            alignItems: "center",
            justifyContent: "flex-start",
            px: 0.25,
            py: 0.5,
          }}
        >
          <Box component="span" sx={pill(moreActive)}>
            <Badge
              color="error"
              variant="dot"
              invisible={!user || !count}
              overlap="circular"
              slotProps={{ badge: { "data-testid": "more-dot" } as object }}
            >
              <MoreHorizOutlined />
            </Badge>
          </Box>
          <Box component="span" sx={labelSx}>
            {t.common.more}
          </Box>
        </ButtonBase>
      </Box>

      <Drawer
        anchor="bottom"
        open={more}
        onClose={() => setMore(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px 24px 0 0",
              px: 1.5,
              pt: 1.75,
              pb: "calc(14px + env(safe-area-inset-bottom, 0px))",
              maxWidth: 480,
              mx: "auto",
            },
            "aria-label": t.common.more,
          },
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 1.75, pb: 1, display: "block" }}
        >
          {t.common.more}
        </Typography>
        {user && (
          <ButtonBase
            onClick={() => {
              setMore(false);
              setBell(true);
            }}
            aria-label={bellLabel}
            aria-haspopup="dialog"
            data-testid="bell-button-phone"
            sx={(theme) => ({
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              gap: 1.5,
              minHeight: 52,
              px: 1.75,
              borderRadius: "14px",
              fontWeight: 700,
              color: theme.palette.text.primary,
              "& svg": { fontSize: 22 },
            })}
          >
            <BellIcon />
            <span>{t.notifications.title}</span>
          </ButtonBase>
        )}
        {rest.map((item) => {
          const current = isActive(item.href, active);
          return (
            <NavLink
              key={item.href}
              href={item.href}
              current={current}
              onClick={() => setMore(false)}
              sx={(theme) => ({
                display: "flex",
                width: "100%",
                justifyContent: "flex-start",
                gap: 1.5,
                minHeight: 52,
                px: 1.75,
                borderRadius: "14px",
                fontWeight: 700,
                color: current ? theme.palette.primary.contrastText : theme.palette.text.primary,
                backgroundImage: current ? theme.palette.surface.gradient : "none",
                "& svg": { fontSize: 22 },
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        {user && (
          <NavLink
            href="/auth/logout"
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              gap: 1.5,
              minHeight: 52,
              px: 1.75,
              borderRadius: "14px",
              fontWeight: 700,
              color: "text.secondary",
            }}
          >
            <LogoutOutlined />
            <span>{t.common.logout}</span>
          </NavLink>
        )}
      </Drawer>
      {user && (
        <NotificationsSheet
          open={bell}
          onClose={() => {
            setBell(false);
            // The row that opened the sheet is gone with the More sheet: focus goes to More.
            moreButton.current?.focus();
          }}
        />
      )}
    </>
  );
};
