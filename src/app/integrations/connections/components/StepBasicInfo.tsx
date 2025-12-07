"use client";

import React from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";

export type StepBasicInfoProps = {
  fullName: string;
  email: string;
  birthday: string;
  githubUrl: string;
  linkedinUrl: string;
  phone: string;
  website: string;
  onFullNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBirthdayChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGithubUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLinkedinUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onWebsiteChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  nameError: boolean;
  emailError: boolean;
};

const shrinkLabelProps = { shrink: true } as const;

import { useLanguage } from "@/components/i18n/LanguageContext";

export const StepBasicInfo: React.FC<StepBasicInfoProps> = ({
  fullName,
  email,
  birthday,
  githubUrl,
  linkedinUrl,
  phone,
  website,
  onFullNameChange,
  onEmailChange,
  onBirthdayChange,
  onGithubUrlChange,
  onLinkedinUrlChange,
  onPhoneChange,
  onWebsiteChange,
  nameError,
  emailError,
}) => {
  const { t } = useLanguage();

  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      <Typography variant="h6" fontWeight={600}>
        {t.integrations.steps.basic.title}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <Box sx={{ gridColumn: "1 / -1" }}>
          <TextField
            label={t.integrations.steps.basic.fullName}
            value={fullName}
            onChange={onFullNameChange}
            required
            error={nameError}
            helperText={nameError ? t.integrations.steps.basic.fullNameRequired : " "}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            label={t.integrations.steps.basic.email}
            type="email"
            value={email}
            onChange={onEmailChange}
            required
            error={emailError}
            helperText={emailError ? t.integrations.steps.basic.emailInvalid : " "}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            label={t.integrations.steps.basic.birthday}
            type="date"
            value={birthday}
            onChange={onBirthdayChange}
            fullWidth
            size="small"
            InputLabelProps={shrinkLabelProps}
          />
        </Box>
        <Box>
          <TextField
            label={t.integrations.steps.basic.github}
            placeholder="https://github.com/username"
            value={githubUrl}
            onChange={onGithubUrlChange}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            label={t.integrations.steps.basic.linkedin}
            placeholder="https://linkedin.com/in/username"
            value={linkedinUrl}
            onChange={onLinkedinUrlChange}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            label={t.integrations.steps.basic.phone}
            value={phone}
            onChange={onPhoneChange}
            fullWidth
            size="small"
          />
        </Box>
        <Box>
          <TextField
            label={t.integrations.steps.basic.website}
            placeholder="https://your-site.com"
            value={website}
            onChange={onWebsiteChange}
            fullWidth
            size="small"
          />
        </Box>
      </Box>
    </Stack>
  );
};
