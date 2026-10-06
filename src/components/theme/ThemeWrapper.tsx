"use client";

import { createContext, useMemo, FC, ReactNode, useState, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import type { ThemeMode } from "@/components/theme/utils/types/types";
import { getTheme } from "@/components/theme/utils/helpers/helpers";

import { cookiesThemeKey } from "@/utils/constants/constants";

interface ThemeWrapperProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export interface DarkModeContextValue {
  mode: ThemeMode;
  toggleMode(): void;
}

export const DarkModeContext = createContext<DarkModeContextValue>({
  mode: "light",
  toggleMode: () => {},
});

export const ThemeWrapper: FC<ThemeWrapperProps> = ({ children, initialMode }) => {
  const [mode, setMode] = useState<ThemeMode>(initialMode ?? "light");

  const theme = useMemo(() => createTheme(getTheme(mode)), [mode]);

  const toggleMode = useCallback(() => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    try {
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `${cookiesThemeKey}=${next}; path=/; max-age=${maxAge}; samesite=lax`;
    } catch {}
  }, [mode]);

  const contextValue = useMemo(() => {
    return { mode, toggleMode };
  }, [mode, toggleMode]);

  return (
    <DarkModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </DarkModeContext.Provider>
  );
};
