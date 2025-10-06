"use client";

import { createContext, useCallback, useMemo, useState, type FC, type ReactNode } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

interface ThemeWrapperProps {
  children: ReactNode;
}

export type ThemeMode = "light" | "dark";

export interface DarkModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

export const DarkModeContext = createContext<DarkModeContextValue>({
  mode: "light",
  toggleMode: () => {},
});

export const ThemeWrapper: FC<ThemeWrapperProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>("light");

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  const contextValue = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <DarkModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </DarkModeContext.Provider>
  );
};
