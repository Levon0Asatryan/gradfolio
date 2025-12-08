"use client";

import { FC, memo } from "react";
import { Box } from "@mui/material";

export interface HighlightedTextProps {
  text: string;
  query?: string;
}

const HighlightedText: FC<HighlightedTextProps> = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;

  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})`, "gi"),
  );

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Box
            component="mark"
            key={i}
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "warning.main" : "warning.light", // More visible highlight color
              color: "inherit",
              px: 0,
              borderRadius: 0,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {part}
          </Box>
        ) : (
          part
        ),
      )}
    </>
  );
};

export default memo(HighlightedText);
