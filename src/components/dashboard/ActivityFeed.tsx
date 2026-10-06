"use client";

import { FC, memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { Activity } from "@/utils/types/dashboard.types";
import { formatDay } from "@/utils/helpers/formatDay";
import { Panel } from "@/components/layout/Panel";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ActivityFeedProps {
  items?: Activity[];
}

const interpolate = (text: string, params?: Record<string, string | number>) =>
  params ? text.replace(/{(\w+)}/g, (_, key) => String(params[key] ?? `{${key}}`)) : text;

const ActivityFeed: FC<ActivityFeedProps> = ({ items = [] }) => {
  const { t, language } = useLanguage();
  const templates: Record<string, string> = t.dashboard.activity;

  return (
    <Panel title={t.dashboard.activityFeed}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t.dashboard.noRecentActivity}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {items.map((a) => (
            <Box
              component="li"
              key={a.id}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                py: 1.5,
                borderTop: 1,
                borderColor: "divider",
                "&:first-of-type": { borderTop: 0, pt: 0 },
                "&:last-of-type": { pb: 0 },
              }}
            >
              <Box
                aria-hidden
                sx={({ palette }) => ({
                  width: 36,
                  height: 36,
                  flex: "none",
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  color: a.type === "project" ? palette.success.main : palette.info.main,
                  bgcolor: palette.surface.soft,
                })}
              >
                {a.type === "project" ? (
                  <EditIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
                  {interpolate(
                    templates[a.translationKey] ?? a.translationKey,
                    a.translationParams,
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDay(a.timestamp, language)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Panel>
  );
};

export default memo(ActivityFeed);
