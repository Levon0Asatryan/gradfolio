"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useSidebarVisibility } from "@/components/layout/SidebarVisibilityContext";
import { Noise } from "@/components/effects/Noise";

export default function NotFound() {
  const { setHidden } = useSidebarVisibility();

  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);

  return (
    <Stack sx={{ p: 3, minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <Noise patternRefreshInterval={2} />
      <Box sx={{ textAlign: "center", maxWidth: 720 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            backgroundImage: (t) =>
              t.palette.mode === "light"
                ? `linear-gradient(90deg, ${t.palette.text.primary}, ${t.palette.primary.main})`
                : `linear-gradient(90deg, ${t.palette.primary.light}, ${t.palette.text.primary})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          404 — Page not found
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          Sorry, we couldn’t find the page you’re looking for. It may have been moved or removed.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mt: 3 }}
          justifyContent="center"
        >
          <Button
            variant="contained"
            color="primary"
            LinkComponent={Link}
            href="/"
            sx={{ borderRadius: 9999 }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            color="primary"
            LinkComponent={Link}
            href="/search"
            sx={{ borderRadius: 9999 }}
          >
            Explore Portfolios
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
