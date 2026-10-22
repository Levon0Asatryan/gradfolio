// Settings page: language and theme, in the same card style as the account page.
"use client";

import { FC, memo, useContext, useState } from "react";
import {
  Alert,
  FormControlLabel,
  Switch,
  MenuItem,
  TextField,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Box,
} from "@mui/material";
import type { EmailPreferences } from "@/lib/api/types";
import { Language } from "@/data/locales/types";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { DarkModeContext } from "@/components/theme/ThemeWrapper";
import { AccountCard } from "@/components/account/AccountCard";
import { PageContainer } from "@/components/layout/PageContainer";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

const SettingsPage: FC<{ initialEmailPreferences?: EmailPreferences; emailError?: boolean }> = ({
  initialEmailPreferences,
  emailError,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleMode } = useContext(DarkModeContext);
  const [preferences, setPreferences] = useState(initialEmailPreferences);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(emailError ?? false);

  async function saveEmail(patch: Partial<EmailPreferences>) {
    setSaving(true);
    setSaveError(false);
    try {
      const response = await fetch("/api/email-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        setSaveError(true);
        return;
      }
      const saved = (await response.json()) as EmailPreferences;
      setPreferences(saved);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  const handleLanguageChange = (_: React.MouseEvent<HTMLElement>, next: Language | null) => {
    if (next !== null) {
      setLanguage(next);
    }
  };

  const handleThemeChange = (_: React.MouseEvent<HTMLElement>, next: string | null) => {
    // An exclusive group sends null when the selected button is pressed again.
    if (next !== null) toggleMode();
  };

  return (
    <PageContainer>
      <Stack spacing={0.5}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {t.common.settings}
        </Typography>
        <Typography color="text.secondary">{t.common.settingsIntro}</Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          alignItems: "stretch",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {saveError && (
          <Alert severity="error" sx={{ gridColumn: "1 / -1" }}>
            {t.emailPreferences.failed}
          </Alert>
        )}
        <AccountCard title={t.common.language} help={t.common.languageHelp}>
          <ToggleButtonGroup
            color="primary"
            value={language}
            exclusive
            onChange={handleLanguageChange}
            aria-label={t.common.language}
            fullWidth
          >
            {/* Native names, never translated: a reader can always find their own language. */}
            <ToggleButton value="en" lang="en">
              English
            </ToggleButton>
            <ToggleButton value="ru" lang="ru">
              Русский
            </ToggleButton>
            <ToggleButton value="am" lang="hy">
              Հայերեն
            </ToggleButton>
          </ToggleButtonGroup>
        </AccountCard>
        {preferences && (
          <AccountCard title={t.emailPreferences.title} help={t.emailPreferences.help}>
            <Stack spacing={2}>
              <FormControlLabel
                label={t.emailPreferences.teamInvites}
                control={
                  <Switch
                    checked={preferences.teamInvitesEnabled}
                    disabled={saving}
                    onChange={(_, checked) => void saveEmail({ teamInvitesEnabled: checked })}
                  />
                }
              />
              <TextField
                select
                label={t.emailPreferences.language}
                value={preferences.preferredLanguage}
                disabled={saving}
                onChange={(event) =>
                  void saveEmail({ preferredLanguage: event.target.value as Language })
                }
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ru">Русский</MenuItem>
                <MenuItem value="am">Հայերեն</MenuItem>
              </TextField>
            </Stack>
          </AccountCard>
        )}

        <AccountCard title={t.common.theme} help={t.common.themeHelp}>
          <ToggleButtonGroup
            color="primary"
            value={mode}
            exclusive
            onChange={handleThemeChange}
            aria-label={t.common.theme}
            fullWidth
          >
            <ToggleButton value="light">
              <LightModeIcon sx={{ mr: 1 }} />
              {t.common.light}
            </ToggleButton>
            <ToggleButton value="dark">
              <DarkModeIcon sx={{ mr: 1 }} />
              {t.common.dark}
            </ToggleButton>
          </ToggleButtonGroup>
        </AccountCard>
      </Box>
    </PageContainer>
  );
};

export default memo(SettingsPage);
