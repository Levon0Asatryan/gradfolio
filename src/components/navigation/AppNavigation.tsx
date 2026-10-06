"use client";

import { type FC, useContext, useMemo } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Image from "next/image";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { usePathname } from "next/navigation";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { DarkModeContext } from "@/components/theme/ThemeWrapper";
import { safeHttpUrl } from "@/utils/helpers/safeHttpUrl";
import { NavLink } from "./NavLink";
import { activeHref, isActive, navItems } from "./navItems";

/** The signed-in user, from the session the layout read on the server. */
export interface NavUser {
  name: string;
  picture?: string;
}

/**
 * The sidebar from `sm` up: icon, label and user card from `lg`; below that an
 * icon-over-label rail. Labels wrap instead of truncating (ru and am run long).
 * On a phone `PhoneNavigation` takes over (this one is `display: none` there).
 */
export const AppNavigation: FC<{ user?: NavUser | null }> = ({ user = null }) => {
  const { mode } = useContext(DarkModeContext);
  const { t } = useLanguage();
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
        width: { sm: 108, lg: 248 },
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        px: { sm: 1, lg: 1.5 },
        py: 2.25,
        bgcolor: theme.palette.navigation.main,
        borderRight: `1px solid ${theme.palette.surface.line}`,
      })}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          px: { sm: 0, lg: 1.25 },
          pb: 1.75,
          justifyContent: { sm: "center", lg: "flex-start" },
        }}
      >
        <Image
          src={mode === "light" ? "/light_logo.png" : "/dark_logo.png"}
          alt=""
          width={36}
          height={36}
        />
        <Typography
          component="span"
          variant="h6"
          sx={{ display: { xs: "none", lg: "inline" }, fontSize: "1.25rem" }}
        >
          Gradfolio
        </Typography>
      </Stack>

      {items.map((item) => {
        const current = isActive(item.href, active);
        return (
          <NavLink
            key={item.href}
            href={item.href}
            current={current}
            sx={(theme) => ({
              display: "flex",
              flexDirection: { sm: "column", lg: "row" },
              alignItems: "center",
              justifyContent: { sm: "center", lg: "flex-start" },
              gap: { sm: 0.5, lg: 1.5 },
              width: "100%",
              minHeight: 44,
              px: { sm: 0.25, lg: 1.75 },
              py: { sm: 1, lg: 1.25 },
              borderRadius: "14px",
              textAlign: { sm: "center", lg: "left" },
              fontWeight: 700,
              fontSize: { sm: "0.75rem", lg: "0.9375rem" },
              lineHeight: 1.25,
              color: current ? theme.palette.primary.contrastText : theme.palette.text.primary,
              backgroundImage: current ? theme.palette.surface.gradient : "none",
              "&:hover": { bgcolor: current ? undefined : theme.palette.surface.soft },
              "& svg": { fontSize: 22, flex: "none" },
              "& .nav-label": { minWidth: 0, overflowWrap: "break-word" },
              // Armenian words are long: a size down keeps them whole in the rail.
              "html[lang='hy'] & .nav-label": { fontSize: { sm: "0.6875rem", lg: "0.9375rem" } },
            })}
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </NavLink>
        );
      })}

      <Box sx={{ flex: 1, minHeight: 12 }} />

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
            justifyContent: { sm: "center", lg: "flex-start" },
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
            sx={{ display: { xs: "none", lg: "block" }, minWidth: 0, overflowWrap: "anywhere" }}
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
            flexDirection: { sm: "column", lg: "row" },
            alignItems: "center",
            justifyContent: { sm: "center", lg: "flex-start" },
            gap: { sm: 0.5, lg: 1.5 },
            minHeight: 44,
            px: { sm: 0.5, lg: 1.75 },
            borderRadius: "14px",
            fontWeight: 700,
            fontSize: { sm: "0.75rem", lg: "0.9375rem" },
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
