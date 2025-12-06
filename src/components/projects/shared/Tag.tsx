"use client";

import { FC, memo, ReactNode } from "react";
import { Chip, type ChipProps } from "@mui/material";

export interface TagProps {
  label: ReactNode;
  onClick?: () => void;
  chipProps?: Omit<ChipProps, "label" | "onClick" | "size">;
}

const Tag: FC<TagProps> = ({ label, onClick, chipProps }) => {
  return (
    <Chip
      label={label}
      size="small"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      sx={{ mr: 1, mb: 1 }}
      {...chipProps}
    />
  );
};

export default memo(Tag);
