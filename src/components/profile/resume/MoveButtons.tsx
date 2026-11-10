"use client";

import { IconButton } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { useLanguage } from "@/components/i18n/LanguageContext";

/** The keyboard and screen-reader way to reorder: the same buttons the editors use. */
export function MoveButtons({
  name,
  canUp,
  canDown,
  disabled,
  onMove,
}: {
  name: string;
  canUp: boolean;
  canDown: boolean;
  disabled?: boolean;
  onMove: (by: -1 | 1) => void;
}) {
  const { t } = useLanguage();
  return (
    <>
      <IconButton
        size="small"
        aria-label={`${t.sectionEdit.moveUp}: ${name}`}
        disabled={disabled || !canUp}
        onClick={() => onMove(-1)}
      >
        <ArrowUpwardIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label={`${t.sectionEdit.moveDown}: ${name}`}
        disabled={disabled || !canDown}
        onClick={() => onMove(1)}
      >
        <ArrowDownwardIcon fontSize="small" />
      </IconButton>
    </>
  );
}
