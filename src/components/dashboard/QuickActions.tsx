"use client";

import { FC, memo } from "react";
import { Button, Card, CardContent, Typography, Stack, alpha, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import { useLanguage } from "@/components/i18n/LanguageContext";

export interface QuickActionsProps {
  onAddProject?: () => void;
  onEditProfile?: () => void;
}

const QuickActions: FC<QuickActionsProps> = ({ onAddProject, onEditProfile }) => {
  const { t } = useLanguage();
  const theme = useTheme();

  return (
    <Card
      component="section"
      aria-label={t.dashboard.quickActions}
      variant="outlined"
      sx={{
        height: "100%",
        transition: (t) => t.transitions.create("box-shadow"),
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t.dashboard.quickActions}
        </Typography>

        <Stack spacing={2}>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            onClick={onAddProject}
            startIcon={<AddIcon />}
            sx={{
              justifyContent: "flex-start",
              textAlign: "left",
              py: 2,
              px: 2.5,
              borderRadius: 2,
              borderWidth: "1px",
              borderColor: alpha(theme.palette.primary.main, 0.3),
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              color: theme.palette.text.primary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderColor: theme.palette.primary.main,
              },
              whiteSpace: "normal", // Allow text wrapping
              height: "auto", // Allow height to grow
              lineHeight: 1.5,
            }}
          >
            <Stack>
              <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
                {t.common.addNewProject}
              </Typography>
            </Stack>
          </Button>

          <Button
            fullWidth
            size="large"
            variant="outlined"
            onClick={onEditProfile}
            startIcon={<EditIcon />}
            sx={{
              justifyContent: "flex-start",
              textAlign: "left",
              py: 2,
              px: 2.5,
              borderRadius: 2,
              borderWidth: "1px",
              borderColor: alpha(theme.palette.secondary.main, 0.3),
              backgroundColor: alpha(theme.palette.secondary.main, 0.02),
              color: theme.palette.text.primary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                borderColor: theme.palette.secondary.main,
              },
              whiteSpace: "normal",
              height: "auto",
              lineHeight: 1.5,
            }}
          >
            <Stack>
              <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
                {t.common.editProfile}
              </Typography>
            </Stack>
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default memo(QuickActions);
