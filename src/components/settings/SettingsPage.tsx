// Settings page: language and theme, in the same card style as the account page.
"use client";

import { FC, memo, useContext } from "react";
import { Typography, ToggleButtonGroup, ToggleButton, Stack, Box } from "@mui/material";
import { Language } from "@/data/locales/types";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { DarkModeContext } from "@/components/theme/ThemeWrapper";
import { AccountCard, pageSx } from "@/components/account/AccountCard";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

const SettingsPage: FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleMode } = useContext(DarkModeContext);

  const handleLanguageChange = (_: React.MouseEvent<HTMLElement>, next: Language | null) => {
    if (next !== null) setLanguage(next);
  };

  const handleThemeChange = (_: React.MouseEvent<HTMLElement>, next: string | null) => {
    // An exclusive group sends null when the selected button is pressed again.
    if (next !== null) toggleMode();
  };

  return (
    <Stack spacing={3} sx={pageSx}>
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
    </Stack>
  );
};

export default memo(SettingsPage);
