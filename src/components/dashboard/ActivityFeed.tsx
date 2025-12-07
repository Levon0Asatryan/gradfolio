"use client";

import { FC, memo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import type { Activity } from "@/utils/types/dashboard.types";
import { formatDate } from "@/utils/helpers/formatDate";

import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ActivityFeedProps {
  items?: Activity[];
  loading?: boolean;
}

const typeColor = (type: Activity["type"]): "default" | "info" | "success" | "warning" => {
  switch (type) {
    case "project":
      return "success";
    case "profile":
      return "warning";
    default:
      return "default";
  }
};

const interpolate = (text: string, params?: Record<string, string | number>) => {
  if (!params) return text;
  return text.replace(/{(\w+)}/g, (_, key) => String(params[key] ?? `{${key}}`));
};

const ActivityFeed: FC<ActivityFeedProps> = ({ items = [], loading }) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card
        component="section"
        aria-label={t.dashboard.activityFeed}
        variant="outlined"
        sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            {t.dashboard.activityFeed}
          </Typography>
          <List dense disablePadding>
            {Array.from({ length: 4 }).map((_, i) => (
              <ListItem key={i} sx={{ px: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                  <Skeleton variant="rounded" width={70} height={22} />
                  <ListItemText
                    primary={<Skeleton variant="text" width="70%" height={18} />}
                    secondary={<Skeleton variant="text" width={120} height={14} />}
                    sx={{ my: 0 }}
                  />
                </Stack>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card
        component="section"
        aria-label={t.dashboard.activityFeed}
        variant="outlined"
        sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t.dashboard.activityFeed}
          </Typography>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {t.dashboard.noRecentActivity}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      component="section"
      aria-label={t.dashboard.activityFeed}
      variant="outlined"
      sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1.5 }} id="activity-feed">
          {t.dashboard.activityFeed}
        </Typography>
        <List dense>
          {items.map((a) => {
            const rawTemplate =
              t.dashboard.activity[a.translationKey as keyof typeof t.dashboard.activity] ||
              a.translationKey;
            const message = interpolate(rawTemplate, a.translationParams);

            return (
              <ListItem
                key={a.id}
                sx={{
                  px: 1,
                  py: 0.75,
                  "&:not(:last-of-type)": (t) => ({
                    borderBottom: `1px solid ${t.palette.divider}`,
                  }),
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                  <Chip
                    size="small"
                    label={t.dashboard.activityTypes[a.type] || a.type}
                    color={typeColor(a.type)}
                    variant="outlined"
                  />
                  <ListItemText
                    primary={<Typography variant="body2">{message}</Typography>}
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(a.timestamp, { withTime: true })}
                      </Typography>
                    }
                    sx={{ my: 0 }}
                  />
                </Stack>
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default memo(ActivityFeed);
