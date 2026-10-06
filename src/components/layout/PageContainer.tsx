import { type FC, type ReactNode } from "react";
import Box from "@mui/material/Box";

/**
 * The one page frame: the gutters, the vertical padding and the width limit that
 * every page shares, on the 8px scale (16 on a phone, 24 on a tablet, 32 on a
 * desktop; 24 / 32 of top and bottom). Children are spaced by `gap` (default
 * 24px), so a page never has to add its own margins between sections.
 */
export const PageContainer: FC<{
  children: ReactNode;
  /** Widest the content grows, in px. Forms and settings are narrower than grids. */
  maxWidth?: number;
  /** Space between the page's direct children, in 8px units; 0 when sections carry their own. */
  gap?: number;
}> = ({ children, maxWidth = 1200, gap = 3 }) => (
  <Box
    sx={{
      width: "100%",
      maxWidth,
      mx: "auto",
      px: { xs: 2, sm: 3, lg: 4 },
      py: { xs: 2.5, sm: 3, lg: 4 },
      display: "flex",
      flexDirection: "column",
      gap,
    }}
  >
    {children}
  </Box>
);
