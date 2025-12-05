"use client";

import { FC, memo } from "react";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import AnalyticsIcon from "@mui/icons-material/Analytics";

export interface QuickActionsProps {
  onAddPublication?: () => void;
  onAddProject?: () => void;
  onEditProfile?: () => void;
  onViewAnalytics?: () => void;
}

const QuickActions: FC<QuickActionsProps> = ({
  onAddPublication,
  onAddProject,
  onEditProfile,
  onViewAnalytics,
}) => {
  return (
    <Card
      component="section"
      aria-label="Quick Actions"
      variant="outlined"
      sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={1.5} columns={{ xs: 12 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              fullWidth
              size="medium"
              sx={{ height: 40 }}
              startIcon={<AddIcon />}
              variant="contained"
              onClick={onAddPublication}
            >
              Add New Publication
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              fullWidth
              size="medium"
              sx={{ height: 40 }}
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={onAddProject}
            >
              Add New Project
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              fullWidth
              size="medium"
              sx={{ height: 40 }}
              startIcon={<EditIcon />}
              variant="outlined"
              onClick={onEditProfile}
            >
              Edit Profile
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              fullWidth
              size="medium"
              sx={{ height: 40 }}
              startIcon={<AnalyticsIcon />}
              variant="outlined"
              onClick={onViewAnalytics}
            >
              View Analytics
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ mt: 1 }} />
        <Stack direction="row" spacing={1} />
      </CardContent>
    </Card>
  );
};

export default memo(QuickActions);
