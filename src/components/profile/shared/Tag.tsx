"use client";

import { FC, memo } from "react";
import { Chip } from "@mui/material";

export interface TagProps {
  label: string;
}

const Tag: FC<TagProps> = ({ label }) => {
  return <Chip label={label} size="small" sx={{ mr: 1, mb: 1 }} />;
};

export default memo(Tag);
