"use client";

import { FC, memo, useContext } from "react";
import { Container, Card, Typography, ToggleButtonGroup, ToggleButton, Stack } from "@mui/material";
import { Language } from "@/data/locales/types";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { DarkModeContext } from "@/components/theme/ThemeWrapper";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

const SettingsPage: FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleMode } = useContext(DarkModeContext);

  const handleLanguageChange = (
    event: React.MouseEvent<HTMLElement>,
    newLanguage: Language | null,
  ) => {
    if (newLanguage !== null) {
      setLanguage(newLanguage);
    }
  };

  const handleThemeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode !== null && newMode !== mode) {
      toggleMode();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {t.common.settings}
        </Typography>

        <Card sx={{ p: 3 }}>
          <Stack spacing={4}>
            {/* Language Settings */}
            <Stack spacing={2}>
              <Typography variant="h6">{t.common.language}</Typography>
              <ToggleButtonGroup
                color="primary"
                value={language}
                exclusive
                onChange={handleLanguageChange}
                aria-label="Language"
                fullWidth
                sx={{ maxWidth: 400 }}
              >
                <ToggleButton value="en">English</ToggleButton>
                <ToggleButton value="ru">Русский</ToggleButton>
                <ToggleButton value="am">Հայերեն</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {/* Theme Settings */}
            <Stack spacing={2}>
              <Typography variant="h6">{t.common.theme}</Typography>
              <ToggleButtonGroup
                color="primary"
                value={mode}
                exclusive
                onChange={handleThemeChange}
                aria-label="Theme"
                fullWidth
                sx={{ maxWidth: 400 }}
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
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

export default memo(SettingsPage);
