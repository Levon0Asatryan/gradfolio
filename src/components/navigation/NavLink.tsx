"use client";

import { type FC, type ReactNode } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import type { SxProps, Theme } from "@mui/material/styles";
import { navLinkComponent } from "./navLinkComponent";

/** One navigation link: a Next `<Link>`, or a plain `<a>` for `/auth/*` (see navLinkComponent). */
export const NavLink: FC<{
  href: string;
  current?: boolean;
  /** A full page load instead of a client-side fetch: a protected page for a visitor (M4 F3). */
  fullLoad?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  children: ReactNode;
}> = ({ href, current, fullLoad, onClick, sx, children }) => (
  <ButtonBase
    component={navLinkComponent(href, fullLoad)}
    href={href}
    onClick={onClick}
    aria-current={current ? "page" : undefined}
    sx={sx}
  >
    {children}
  </ButtonBase>
);
