"use client";

import React from "react";
import { Stack, Typography, Button } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";

export type StepWelcomeProps = {
  ghImported: boolean;
  ghImporting: boolean;
  liImported: boolean;
  liImporting: boolean;
  onImportGithub: () => void;
  onImportLinkedin: () => void;
};

export const StepWelcome: React.FC<StepWelcomeProps> = ({
  ghImported,
  ghImporting,
  liImported,
  liImporting,
  onImportGithub,
  onImportLinkedin,
}) => {
  const { t } = useLanguage();

  return (
    <Stack spacing={3} sx={{ py: 1 }}>
      <Stack spacing={1}>
        <Typography variant="h5" component="h2">
          {t.integrations.steps.welcome}
        </Typography>
        <Typography color="text.secondary">{t.integrations.steps.welcomeSubtitle}</Typography>
      </Stack>
      <Stack spacing={2}>
        <Button
          variant="outlined"
          onClick={onImportGithub}
          startIcon={ghImported ? <CheckCircleOutlineOutlinedIcon /> : <GitHubIcon />}
          fullWidth
          disabled={ghImporting || ghImported}
          color={ghImported ? "success" : "primary"}
        >
          {ghImported
            ? t.integrations.steps.importedGithub
            : ghImporting
              ? t.integrations.steps.importingGithub
              : t.integrations.steps.importGithub}
        </Button>
        <Button
          variant="outlined"
          onClick={onImportLinkedin}
          startIcon={liImported ? <CheckCircleOutlineOutlinedIcon /> : <LinkedInIcon />}
          fullWidth
          disabled={liImporting || liImported}
          color={liImported ? "success" : "primary"}
        >
          {liImported
            ? t.integrations.steps.importedLinkedin
            : liImporting
              ? t.integrations.steps.importingLinkedin
              : t.integrations.steps.importLinkedin}
        </Button>
      </Stack>
    </Stack>
  );
};
