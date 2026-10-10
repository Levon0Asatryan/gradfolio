import { type ReactNode } from "react";
import ExploreOutlined from "@mui/icons-material/ExploreOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import LoginOutlined from "@mui/icons-material/LoginOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import ExtensionOutlined from "@mui/icons-material/ExtensionOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import SpaceDashboardOutlined from "@mui/icons-material/SpaceDashboardOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import type { Dictionary } from "@/data/locales/types";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  /** Shown in the phone bar; the rest go under "More". */
  primary?: boolean;
}

/** Shown only to a signed-out visitor: login, and the login-connections stepper. */
const SIGNED_OUT_ONLY = new Set(["/auth/login", "/integrations/connections"]);

/** The navigation, in order. Signed-in users do not see the sign-in items. */
export function navItems(t: Dictionary, signedIn: boolean): NavItem[] {
  const all: NavItem[] = [
    { label: t.common.dashboard, href: "/", icon: <SpaceDashboardOutlined />, primary: true },
    { label: t.common.login, href: "/auth/login", icon: <LoginOutlined /> },
    {
      label: t.common.loginConnections,
      href: "/integrations/connections",
      icon: <LinkOutlined />,
    },
    { label: t.common.myProfile, href: "/profile", icon: <PersonOutlined />, primary: true },
    { label: t.common.projects, href: "/projects", icon: <FolderOutlined />, primary: true },
    { label: t.common.teams, href: "/teams", icon: <GroupsOutlined /> },
    { label: t.common.explore, href: "/search", icon: <ExploreOutlined />, primary: true },
    { label: t.common.integrations, href: "/integrations", icon: <ExtensionOutlined /> },
    { label: t.common.account, href: "/account", icon: <ShieldOutlined /> },
    { label: t.common.settings, href: "/settings", icon: <TuneOutlined /> },
  ];
  return signedIn ? all.filter((i) => !SIGNED_OUT_ONLY.has(i.href)) : all;
}

const normalize = (path: string) =>
  path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

/**
 * The item for the current page: the longest href that is a prefix of the path.
 * `/projects/<id>` of someone else's project (opened from Explore) does not
 * light up "Projects"; only your own list and `prj_` ids do.
 */
export function activeHref(pathname: string | null, items: NavItem[]): string {
  const cur = normalize(pathname ?? "/");
  let best = "";
  for (const item of items) {
    const href = normalize(item.href);
    const matches = cur === href || (href !== "/" && cur.startsWith(`${href}/`));
    if (!matches) continue;
    if (href === "/projects" && cur !== "/projects" && !cur.includes("/prj_")) continue;
    if (href.length > best.length) best = href;
  }
  return best;
}

export const isActive = (href: string, active: string) => normalize(href) === active;
