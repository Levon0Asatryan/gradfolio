"use client";

import { memo, type FC, type ReactNode } from "react";
import { Box, Card, CardActions, CardContent, Chip, Stack, Typography } from "@mui/material";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import GitHub from "@mui/icons-material/GitHub";
import LinkedIn from "@mui/icons-material/LinkedIn";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import { formatDay } from "@/utils/helpers/formatDay";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface IntegrationCardProps {
  id: "github" | "linkedin";
  name: string;
  description: string;
  connected: boolean;
  /** The label before the date, and the text when there is none. Omit to show no sync line. */
  syncLabel?: string;
  /** ISO 8601; `null` shows `neverText`. Ignored without `syncLabel`. */
  syncedAt?: string | null;
  neverText?: string;
  /** Extra facts under the description (the connected login, how LinkedIn is connected). */
  detail?: ReactNode;
  /** Buttons. */
  children?: ReactNode;
  /** An alert shown inside the card, under the actions. */
  notice?: ReactNode;
}

/**
 * One integration: what it is, whether it is connected (text and an icon, never colour
 * alone), when it last synced, and its actions.
 */
const IntegrationCard: FC<IntegrationCardProps> = ({
  id,
  name,
  description,
  connected,
  syncLabel,
  syncedAt,
  neverText,
  detail,
  children,
  notice,
}) => {
  const { t, language } = useLanguage();
  const titleId = `integration-${id}`;

  return (
    <Card
      component="section"
      aria-labelledby={titleId}
      sx={{
        bgcolor: "background.paper",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3, "&:last-child": { pb: 2 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              aria-hidden
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 3,
                bgcolor: "surface.soft",
                color: "text.primary",
              }}
            >
              {id === "github" ? <GitHub fontSize="small" /> : <LinkedIn fontSize="small" />}
            </Box>
            <Typography id={titleId} component="h2" variant="h6">
              {name}
            </Typography>
          </Stack>
          <Chip
            size="small"
            color={connected ? "success" : "default"}
            icon={connected ? <CheckCircleOutlined /> : <RemoveCircleOutline />}
            label={connected ? t.integrations.connected : t.integrations.notConnected}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        {detail && <Box sx={{ mt: 1.5 }}>{detail}</Box>}
        {syncLabel && (
          <Typography
            variant="caption"
            color="text.secondary"
            suppressHydrationWarning
            sx={{ display: "block", mt: 1.5 }}
          >
            {syncedAt ? `${syncLabel} ${formatDay(syncedAt, language)}` : neverText}
          </Typography>
        )}
      </CardContent>

      {children && (
        <CardActions sx={{ px: 3, pb: 3, pt: 0, gap: 1, flexWrap: "wrap" }}>{children}</CardActions>
      )}
      {notice && <Box sx={{ px: 3, pb: 3 }}>{notice}</Box>}
    </Card>
  );
};

export default memo(IntegrationCard);
