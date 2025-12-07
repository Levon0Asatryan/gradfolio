"use client";

import { FC, memo } from "react";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import { useLanguage } from "@/components/i18n/LanguageContext";

export interface QuickActionsProps {
  onAddProject?: () => void;
  onEditProfile?: () => void;
}

const QuickActions: FC<QuickActionsProps> = ({ onAddProject, onEditProfile }) => {
  const { t } = useLanguage();

  return (
    <Card
      component="section"
      aria-label={t.dashboard.quickActions}
      variant="outlined"
      sx={{ transition: (t) => t.transitions.create("box-shadow") }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t.dashboard.quickActions}
        </Typography>
        <Grid container spacing={1.5} columns={{ xs: 12 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              fullWidth
              size="large"
              sx={{ py: 2, px: 2, minHeight: 64 }}
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={onAddProject}
            >
              {t.common.addNewProject}
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              fullWidth
              size="large"
              sx={{ py: 2, px: 2, minHeight: 64 }}
              startIcon={<EditIcon />}
              variant="outlined"
              onClick={onEditProfile}
            >
              {t.common.editProfile}
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
};

export default memo(QuickActions);
