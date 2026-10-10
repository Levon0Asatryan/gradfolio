"use client";

import { FC, type ReactNode } from "react";
import Link from "next/link";
import ButtonBase from "@mui/material/ButtonBase";

/**
 * A filter that is a link: the URL is the state, so it works without JavaScript and a
 * filtered list can be shared. The chosen one is `aria-current` and differs in colour and
 * weight, not by colour alone.
 */
export const FilterLink: FC<{ href: string; selected: boolean; children: ReactNode }> = ({
  href,
  selected,
  children,
}) => (
  <ButtonBase
    component={Link}
    href={href}
    prefetch={false}
    aria-current={selected ? "true" : undefined}
    sx={({ palette }) => ({
      minHeight: 44,
      px: 2,
      borderRadius: 999,
      border: 2,
      borderColor: selected ? palette.primary.main : palette.surface.lineStrong,
      bgcolor: selected ? palette.primary.main : "transparent",
      color: selected ? palette.primary.contrastText : palette.text.primary,
      fontFamily: "inherit",
      fontSize: "0.875rem",
      fontWeight: selected ? 800 : 700,
      lineHeight: 1.2,
      "&:hover": { borderColor: palette.primary.main },
    })}
  >
    {children}
  </ButtonBase>
);
