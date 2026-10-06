"use client";

import { type FC, type ReactNode, useId } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

export interface PanelProps {
  title: string;
  /** Sits opposite the title (a "View all" link). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * A titled card: 24px inside on every side, 16px under the title row. The one
 * card shape the dashboard and the project page share, so padding never varies.
 */
export const Panel: FC<PanelProps> = ({ title, action, children }) => {
  const id = useId();
  return (
    <Card
      component="section"
      aria-labelledby={id}
      sx={{ p: 3, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography id={id} variant="h6" component="h2">
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Card>
  );
};
