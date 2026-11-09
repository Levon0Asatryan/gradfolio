"use client";

import type { ReactNode } from "react";
import { Box, Switch, Typography } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { RADIUS, surfaces } from "@/components/theme/tokens";
import { MoveButtons } from "./MoveButtons";

/**
 * One resume block: a card with its position, name, move buttons and an on/off switch.
 * Off is told by the dashed border, the dimmed name and the word "Off", never by colour
 * alone. `children` is the block's own content (the project list), shown while it is on.
 */
export function SectionCard({
  handle,
  name,
  position,
  enabled,
  canUp,
  canDown,
  busy,
  detail,
  onToggle,
  onMove,
  children,
}: {
  handle: ReactNode;
  name: string;
  /** 1-based place among the blocks that are on; ignored when off. */
  position: number;
  enabled: boolean;
  canUp: boolean;
  canDown: boolean;
  busy: boolean;
  detail?: ReactNode;
  onToggle: (on: boolean) => void;
  onMove: (by: -1 | 1) => void;
  children?: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <Box
      sx={(theme) => {
        const s = surfaces(theme.palette.mode);
        return {
          mb: 1.25,
          borderRadius: `${RADIUS.card}px`,
          overflow: "hidden",
          border: enabled
            ? `1px solid ${theme.palette.primary.main}`
            : `1px dashed ${s.lineStrong}`,
          bgcolor: enabled ? s.soft : "background.paper",
          transition: theme.transitions.create(["background-color", "border-color"], {
            duration: 120,
          }),
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        };
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: { xs: 0.5, sm: 1 },
          p: 1,
          minHeight: 64,
        }}
      >
        {handle}
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            flex: "none",
            width: 26,
            height: 26,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            ...(enabled
              ? { bgcolor: "primary.main", color: "primary.contrastText" }
              : {
                  border: `1.5px dashed ${surfaces(theme.palette.mode).lineStrong}`,
                  color: "text.secondary",
                }),
          })}
        >
          {enabled ? position : "–"}
        </Box>
        <Box sx={{ flex: "1 1 96px", minWidth: 0 }}>
          <Typography
            component="span"
            sx={{
              display: "block",
              fontWeight: enabled ? 800 : 700,
              color: enabled ? "text.primary" : "text.secondary",
              overflowWrap: "break-word",
            }}
          >
            {name}
          </Typography>
          {enabled ? (
            detail
          ) : (
            <Typography component="span" variant="caption" color="text.secondary">
              {t.resume.off}
            </Typography>
          )}
        </Box>
        {enabled && (
          <Box
            sx={{
              display: "flex",
              // On a phone the arrows take their own row under the name.
              order: { xs: 1, sm: 0 },
              flexBasis: { xs: "100%", sm: "auto" },
              justifyContent: "flex-end",
              pl: { xs: 5, sm: 0 },
            }}
          >
            <MoveButtons
              name={name}
              canUp={canUp}
              canDown={canDown}
              disabled={busy}
              onMove={onMove}
            />
          </Box>
        )}
        <Switch
          checked={enabled}
          disabled={busy}
          onChange={(_, checked) => onToggle(checked)}
          slotProps={{ input: { "aria-label": name } }}
        />
      </Box>
      {enabled && children}
    </Box>
  );
}
