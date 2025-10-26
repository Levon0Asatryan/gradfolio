"use client";

import { FC, memo } from "react";
import { Tooltip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export interface VerifiedBadgeProps {
  visible: boolean;
  label?: string;
}

const VerifiedBadge: FC<VerifiedBadgeProps> = ({ visible, label = "Verified account" }) => {
  if (!visible) return null;
  return (
    <Tooltip title={label} aria-label={label} placement="top">
      <CheckCircleIcon color="success" fontSize="small" aria-hidden={false} />
    </Tooltip>
  );
};

export default memo(VerifiedBadge);
