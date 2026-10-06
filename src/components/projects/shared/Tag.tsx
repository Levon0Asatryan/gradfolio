// A reusable Tag component using MUI Chip, supporting optional click handler and custom props
"use client";

import { FC, memo, ReactNode } from "react";
import { Chip, type ChipProps } from "@mui/material";

export interface TagProps {
  label: ReactNode;
  onClick?: () => void;
  chipProps?: Omit<ChipProps, "label" | "onClick" | "size">;
}

// No margins of its own: the parent lays tags out with `gap`.
const Tag: FC<TagProps> = ({ label, onClick, chipProps }) => {
  return (
    <Chip
      label={label}
      size="small"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      {...chipProps}
    />
  );
};

export default memo(Tag);
