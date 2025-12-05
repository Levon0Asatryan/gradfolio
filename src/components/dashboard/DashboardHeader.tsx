"use client";

import { FC, memo } from "react";
import { Avatar, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArticleIcon from "@mui/icons-material/Article";
import FolderIcon from "@mui/icons-material/Folder";
import type { DashboardStats } from "@/utils/types/dashboard.types";

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
  onViewAnalytics,
}) => {
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
        backgroundImage: (t) =>
          `linear-gradient(180deg, ${t.palette.action.hover} 0%, transparent 100%)`,
      }}
    >
      <CardContent>
        <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Avatar src={user.avatarUrl} alt={user.name} sx={{ width: 56, height: 56 }} />
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
                  icon={<VisibilityIcon />}
                  label={`${stats?.profileViews ?? 0} views`}
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 6 }}>
                <Chip
                  icon={<AnalyticsIcon />}
                  label={`${engagementRate.toFixed(1)}% engagement`}
                  color="info"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 6 }}>
                <Chip
                  icon={<ArticleIcon />}
                  label={`${stats?.totalPublications ?? 0} publications`}
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 6 }}>
                <Chip
                  icon={<FolderIcon />}
                  label={`${stats?.totalProjects ?? 0} projects`}
                  variant="outlined"
                  sx={{ width: "100%" }}
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
            sx={{ height: 40 }}
          >
            Edit Profile
          </Button>
          <Button
            startIcon={<AnalyticsIcon />}
            variant="contained"
            onClick={onViewAnalytics}
            sx={{ height: 40 }}
          >
            View Analytics
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default memo(DashboardHeader);
