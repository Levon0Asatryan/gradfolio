"use client";

import { type FC, type ReactNode } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import type { SxProps, Theme } from "@mui/material/styles";
import { navLinkComponent } from "./navLinkComponent";

/** One navigation link: a Next `<Link>`, or a plain `<a>` for `/auth/*` (see navLinkComponent). */
export const NavLink: FC<{
  href: string;
  current?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  children: ReactNode;
}> = ({ href, current, onClick, sx, children }) => (
  <ButtonBase
    component={navLinkComponent(href)}
    href={href}
    onClick={onClick}
    aria-current={current ? "page" : undefined}
    sx={sx}
  >
    {children}
  </ButtonBase>
);
