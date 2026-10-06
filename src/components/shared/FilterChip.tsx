"use client";

import { type FC, type ReactNode } from "react";
import ButtonBase from "@mui/material/ButtonBase";

export interface FilterChipProps {
  label: ReactNode;
  selected: boolean;
  onClick: () => void;
}

/** A toggle that filters a list: a 44px target, pressed state in text and colour. */
export const FilterChip: FC<FilterChipProps> = ({ label, selected, onClick }) => (
  <ButtonBase
    onClick={onClick}
    aria-pressed={selected}
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
      fontWeight: 800,
      lineHeight: 1.2,
      textAlign: "center",
      "&:hover": {
        bgcolor: selected ? palette.primary.main : palette.surface.soft,
        borderColor: palette.primary.main,
      },
    })}
  >
    {label}
  </ButtonBase>
);
