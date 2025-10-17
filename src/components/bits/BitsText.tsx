import React from "react";
import { Typography, TypographyProps } from "@mui/material";

export type BitsTextProps = TypographyProps & {
  gradient?: string;
};

export const BitsText: React.FC<BitsTextProps> = ({ children, gradient, sx, ...props }) => {
  return (
    <Typography
      {...props}
      sx={{
        fontWeight: 800,
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
        backgroundImage: (theme) =>
          gradient ??
          (theme.palette.mode === "light"
            ? `linear-gradient(90deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`
            : `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.text.primary})`),
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        ...((sx as any) || {}),
      }}
    >
      {children}
    </Typography>
  );
};
