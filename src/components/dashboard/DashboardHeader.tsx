"use client";

import { FC, memo } from "react";
import { Avatar, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import EditIcon from "@mui/icons-material/Edit";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import FolderIcon from "@mui/icons-material/Folder";
import type { DashboardStats } from "@/utils/types/dashboard.types";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface DashboardHeaderUser {
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
}

export interface DashboardHeaderProps {
  user?: DashboardHeaderUser;
  stats?: DashboardStats;
  engagementRate?: number; // 0-100
  onEditProfile?: () => void;
  onViewAnalytics?: () => void;
}

const DEFAULT_USER: DashboardHeaderUser = {
  name: "Alex Johnson",
  title: "Research Scientist • AI & Data Visualization",
  bio: "Exploring interpretable machine learning and building tools that make research insights more accessible.",
  avatarUrl: undefined,
};

const DashboardHeader: FC<DashboardHeaderProps> = ({
  user = DEFAULT_USER,
  stats,
  engagementRate = 3.7,
  onEditProfile,
}) => {
  const { t } = useLanguage();

  return (
    <Card
      component="section"
      aria-label="Profile and Analytics"
      variant="outlined"
      sx={{
        mb: 2,
        overflow: "hidden",
        transition: (t) => t.transitions.create("box-shadow"),
        "&:hover": { boxShadow: 6 },
        bgcolor: "background.paper",
      }}
    >
      <CardContent>
        <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Avatar src={user.avatarUrl} alt={user.name} sx={{ width: 100, height: 100 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ lineHeight: 1.2 }} noWrap title={user.name}>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap title={user.title}>
                  {user.title}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 1, md: 0 } }}>
              {user.bio}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Grid container spacing={1} columns={{ xs: 12 }}>
              <Grid size={{ xs: 6, sm: 6 }}>
                <Chip
                  icon={<LinkedInIcon />}
                  label={`${stats?.linkedinConnections ?? 0} ${t.dashboard.connections}`}
                  variant="outlined"
                  sx={{ width: "100%", userSelect: "none" }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 6 }}>
                <Chip
                  icon={<AnalyticsIcon />}
                  label={`${engagementRate.toFixed(1)}% ${t.dashboard.engagement}`}
                  color="info"
                  variant="outlined"
                  sx={{ width: "100%", userSelect: "none" }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12 }}>
                <Chip
                  icon={<FolderIcon />}
                  label={`${stats?.totalProjects ?? 0} ${t.dashboard.projects}`}
                  variant="outlined"
                  sx={{ width: "100%", userSelect: "none" }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            startIcon={<EditIcon />}
            variant="outlined"
            onClick={onEditProfile}
            sx={{ px: 2, py: 1 }}
          >
            {t.common.editProfile}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default memo(DashboardHeader);
