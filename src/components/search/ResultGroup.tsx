"use client";

import { FC, type ReactNode } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

/** Cards in one responsive grid, with a heading and, when there is more, a link to all. */
export const ResultGroup: FC<{
  heading: string;
  empty: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  /** Whether the group has nothing to show (the message replaces the grid). */
  isEmpty: boolean;
  children: ReactNode;
}> = ({ heading, empty, seeAllHref, seeAllLabel, isEmpty, children }) => (
  <Box
    component="section"
    aria-label={heading}
    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
  >
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="h5" component="h2">
        {heading}
      </Typography>
      {seeAllHref && seeAllLabel && (
        <Button component={Link} href={seeAllHref} variant="text">
          {seeAllLabel}
        </Button>
      )}
    </Box>
    {isEmpty ? (
      <Typography color="text.secondary">{empty}</Typography>
    ) : (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
          gap: 3,
        }}
      >
        {children}
      </Box>
    )}
  </Box>
);
