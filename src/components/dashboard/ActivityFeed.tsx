"use client";

import { FC, memo } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Notifications as DefaultIcon,
} from "@mui/icons-material";
import type { Activity } from "@/utils/types/dashboard.types";
import { formatDate } from "@/utils/helpers/formatDate";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ActivityFeedProps {
  items?: Activity[];
  loading?: boolean;
}

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "project":
      return <EditIcon fontSize="small" />;
    case "profile":
      return <VisibilityIcon fontSize="small" />;
    default:
      return <DefaultIcon fontSize="small" />;
  }
};

const getActivityColor = (type: Activity["type"]): "success" | "warning" | "info" => {
  switch (type) {
    case "project":
      return "success";
    case "profile":
      return "warning";
    default:
      return "info";
  }
};

const interpolate = (text: string, params?: Record<string, string | number>) => {
  if (!params) return text;
  return text.replace(/{(\w+)}/g, (_, key) => String(params[key] ?? `{${key}}`));
};

const ActivityFeed: FC<ActivityFeedProps> = ({ items = [], loading }) => {
  const { t } = useLanguage();
  const theme = useTheme();

  if (loading) {
    return (
      <Card
        component="section"
        aria-label={t.dashboard.activityFeed}
        variant="outlined"
        sx={{
          height: "100%",
          transition: (t) => t.transitions.create("box-shadow"),
          "&:hover": { boxShadow: 6 },
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t.dashboard.activityFeed}
          </Typography>
          <Stack spacing={2}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="circular" width={40} height={40} />
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={24} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
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
        sx={{
          height: "100%",
          transition: (t) => t.transitions.create("box-shadow"),
          "&:hover": { boxShadow: 6 },
        }}
      >
        <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t.dashboard.activityFeed}
          </Typography>
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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
      sx={{
        height: "100%",
        transition: (t) => t.transitions.create("box-shadow"),
        "&:hover": { boxShadow: 6 },
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }} id="activity-feed">
          {t.dashboard.activityFeed}
        </Typography>
        <Stack spacing={2}>
          {items.map((a) => {
            const rawTemplate =
              t.dashboard.activity[a.translationKey as keyof typeof t.dashboard.activity] ||
              a.translationKey;
            const message = interpolate(rawTemplate, a.translationParams);

            const colorKey = getActivityColor(a.type);
            const paletteColor = theme.palette[colorKey];

            return (
              <Box
                key={a.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: alpha(paletteColor.main, 0.3),
                  backgroundColor: alpha(paletteColor.main, 0.02),
                  transition: theme.transitions.create(["background-color", "border-color"]),
                  "&:hover": {
                    backgroundColor: alpha(paletteColor.main, 0.08),
                    borderColor: paletteColor.main,
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: alpha(paletteColor.main, 0.1),
                    color: paletteColor.main,
                    width: 40,
                    height: 40,
                  }}
                >
                  {getActivityIcon(a.type)}
                </Avatar>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                    {message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(a.timestamp, { withTime: true })}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default memo(ActivityFeed);
