import React from "react";
import { Box } from "@mui/material";

export const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ px: 2, py: 0 }}>{children}</Box>
);
