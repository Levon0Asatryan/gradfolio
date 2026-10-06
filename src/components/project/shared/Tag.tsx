"use client";

import { FC, memo, useCallback } from "react";
import { Chip } from "@mui/material";

export interface TagProps {
  label: string;
  onClick?: (label: string) => void;
}

const Tag: FC<TagProps> = ({ label, onClick }) => {
  const handleClick = useCallback(() => {
    onClick?.(label);
  }, [label, onClick]);

  return (
    <Chip
      label={label}
      size="small"
      onClick={onClick ? handleClick : undefined}
      role={onClick ? "button" : undefined}
    />
  );
};

// Export memoized component for performance optimization
export default memo(Tag);
