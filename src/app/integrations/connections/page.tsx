"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Stepper, Step } from "@/components/stepper";
import { initialProfileForm, type ProfileForm } from "@/utils/constants/constants";
import { isNonEmpty, isValidEmail } from "@/utils/helpers/validation";
import { StepWelcome } from "./components/StepWelcome";
import { StepBasicInfo } from "./components/StepBasicInfo";
import { StepExperienceEducation } from "./components/StepExperienceEducation";
import { StepRepos } from "./components/StepRepos";

const GITHUB_COLOR = "#181717"; // GitHub brand
const LINKEDIN_COLOR = "#0A66C2"; // LinkedIn brand

export default function LoginConnectionsPage() {
  const [form, setForm] = useState<ProfileForm>(initialProfileForm);
  const [ghImporting, setGhImporting] = useState(false);
  const [liImporting, setLiImporting] = useState(false);
  const [ghImported, setGhImported] = useState(false);
  const [liImported, setLiImported] = useState(false);

  const handleFullNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, fullName: e.target.value }));
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, email: e.target.value }));
  }, []);

  const handleBirthdayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, birthday: e.target.value }));
  }, []);

  const handleGithubUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, githubUrl: e.target.value }));
  }, []);

  const handleLinkedinUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, linkedinUrl: e.target.value }));
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, phone: e.target.value }));
  }, []);

  const handleWebsiteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, website: e.target.value }));
  }, []);

  const handleExperienceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, experience: e.target.value }));
  }, []);

  const handleEducationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, education: e.target.value }));
  }, []);

  const handleReposChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, repos: e.target.value }));
  }, []);

  const handleImportGithub = useCallback(() => {
    if (ghImporting || ghImported) return;
    setGhImporting(true);
    window.setTimeout(() => {
      setGhImporting(false);
      setGhImported(true);
      setForm((prev) => ({
        ...prev,
        githubUrl: prev.githubUrl || "https://github.com/your-username",
      }));
    }, 900);
  }, [ghImporting, ghImported]);

  const handleImportLinkedin = useCallback(() => {
    if (liImporting || liImported) return;
    setLiImporting(true);
    window.setTimeout(() => {
      setLiImporting(false);
      setLiImported(true);
      setForm((prev) => ({
        ...prev,
        linkedinUrl: prev.linkedinUrl || "https://www.linkedin.com/in/your-username",
      }));
    }, 900);
  }, [liImporting, liImported]);

  const nameError = useMemo(() => !isNonEmpty(form.fullName), [form.fullName]);
  const emailError = useMemo(() => !isValidEmail(form.email), [form.email]);

  const canProceed = useCallback(
    (step: number) => {
      if (step === 2) {
        return !nameError && !emailError;
      }
      return true;
    },
    [emailError, nameError],
  );

  const handleStepChange = useCallback((step: number) => {
    // eslint-disable-next-line no-console
    console.log("Stepper step:", step);
  }, []);

  const handleFinalComplete = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("All steps completed!", form);
  }, [form]);

  return (
    <Stack sx={{ p: 3, gap: 2 }}>
      <Typography variant="h4" color="text.primary">
        Integrations Setup
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Let’s get your Gradfolio ready by connecting your data sources and filling in the basics.
      </Typography>

      <Stepper
        initialStep={1}
        onStepChange={handleStepChange}
        onFinalStepCompleted={handleFinalComplete}
        backButtonText="Previous"
        nextButtonText="Next"
        canProceed={canProceed}
        sx={{ width: "100%" }}
        stepperContainerSx={(theme: Theme) => ({
          bgcolor: theme.palette.background.paper,
          borderColor: theme.palette.divider,
        })}
        contentSx={(theme: Theme) => ({
          color: theme.palette.text.primary,
        })}
      >
        {/* Step 1 - Welcome & Integrations */}
        <Step>
          <StepWelcome
            ghImported={ghImported}
            ghImporting={ghImporting}
            liImported={liImported}
            liImporting={liImporting}
            onImportGithub={handleImportGithub}
            onImportLinkedin={handleImportLinkedin}
            githubColor={GITHUB_COLOR}
            linkedinColor={LINKEDIN_COLOR}
          />
        </Step>

        {/* Step 2 - Basic info */}
        <Step>
          <StepBasicInfo
            fullName={form.fullName}
            email={form.email}
            birthday={form.birthday}
            githubUrl={form.githubUrl}
            linkedinUrl={form.linkedinUrl}
            phone={form.phone}
            website={form.website}
            onFullNameChange={handleFullNameChange}
            onEmailChange={handleEmailChange}
            onBirthdayChange={handleBirthdayChange}
            onGithubUrlChange={handleGithubUrlChange}
            onLinkedinUrlChange={handleLinkedinUrlChange}
            onPhoneChange={handlePhoneChange}
            onWebsiteChange={handleWebsiteChange}
            nameError={nameError}
            emailError={emailError}
          />
        </Step>

        {/* Step 3 - Experience & Education */}
        <Step>
          <StepExperienceEducation
            experience={form.experience}
            education={form.education}
            onExperienceChange={handleExperienceChange}
            onEducationChange={handleEducationChange}
          />
        </Step>

        {/* Step 4 - GitHub Repos */}
        <Step>
          <StepRepos reposText={form.repos} onReposChange={handleReposChange} />
        </Step>
      </Stepper>
    </Stack>
  );
}
