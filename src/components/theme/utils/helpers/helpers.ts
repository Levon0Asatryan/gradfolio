import type { PaletteMode } from "@mui/material";
import { grey } from "@mui/material/colors";

export const getTheme = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: {
      main: mode === "light" ? "#000000" : grey[300],
    },
    navigation: {
      main: mode === "light" ? grey[50] : "#1e1e1e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});
