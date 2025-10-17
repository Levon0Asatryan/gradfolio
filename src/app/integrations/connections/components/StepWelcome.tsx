"use client";

import React from "react";
import { Stack, Typography, Button } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { TextType } from "@/components/text/TextType";

export type StepWelcomeProps = {
  ghImported: boolean;
  ghImporting: boolean;
  liImported: boolean;
  liImporting: boolean;
  onImportGithub: () => void;
  onImportLinkedin: () => void;
  githubColor?: string;
  linkedinColor?: string;
};

const GITHUB_FALLBACK = "#181717";
const LINKEDIN_FALLBACK = "#0A66C2";

export const StepWelcome: React.FC<StepWelcomeProps> = ({
  ghImported,
  ghImporting,
  liImported,
  liImporting,
  onImportGithub,
  onImportLinkedin,
  githubColor = GITHUB_FALLBACK,
  linkedinColor = LINKEDIN_FALLBACK,
}) => {
  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      <Stack>
        <TextType
          text={["Welcome to the Gradfolio!"]}
          variant="h5"
          typingSpeed={60}
          pauseDuration={600}
          showCursor
          cursorCharacter="_"
          loop
          sx={{ height: 52 }}
        />
        <Typography color="text.secondary">
          Connect your GitHub or LinkedIn to auto-import data, or skip and fill things manually —
          your call 🎯✨
        </Typography>
      </Stack>
      <Stack spacing={1.25}>
        <Button
          variant="contained"
          onClick={onImportGithub}
          startIcon={ghImported ? <CheckCircleOutlineOutlinedIcon /> : <GitHubIcon />}
          fullWidth
          disabled={ghImporting || ghImported}
          sx={{
            bgcolor: (t: Theme) => (ghImported ? t.palette.success.main : githubColor),
            color: (t: Theme) =>
              t.palette.getContrastText(ghImported ? t.palette.success.main : githubColor),
            ":hover": {
              bgcolor: (t: Theme) => (ghImported ? t.palette.success.dark : "#24292f"),
            },
          }}
        >
          {ghImported
            ? "GitHub data imported"
            : ghImporting
              ? "Importing from GitHub..."
              : "Import from GitHub"}
        </Button>
        <Button
          variant="contained"
          onClick={onImportLinkedin}
          startIcon={liImported ? <CheckCircleOutlineOutlinedIcon /> : <LinkedInIcon />}
          fullWidth
          disabled={liImporting || liImported}
          sx={{
            bgcolor: (t: Theme) => (liImported ? t.palette.success.main : linkedinColor),
            color: (t: Theme) =>
              t.palette.getContrastText(liImported ? t.palette.success.main : linkedinColor),
            ":hover": {
              bgcolor: (t: Theme) => (liImported ? t.palette.success.dark : "#0a5ab0"),
            },
          }}
        >
          {liImported
            ? "LinkedIn data imported"
            : liImporting
              ? "Importing from LinkedIn..."
              : "Import from LinkedIn"}
        </Button>
      </Stack>
    </Stack>
  );
};
