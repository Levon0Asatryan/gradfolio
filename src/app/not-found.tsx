"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useSidebarVisibility } from "@/components/layout/SidebarVisibilityContext";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { Noise } from "@/components/effects/Noise";

export default function NotFound() {
  const { setHidden } = useSidebarVisibility();
  const { t } = useLanguage();

  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);

  return (
    <Stack sx={{ p: 3, minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <Noise patternRefreshInterval={2} />
      <Box sx={{ textAlign: "center", maxWidth: 720 }}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
          <BrandLogo height={40} />
        </Box>
        <Typography
          variant="h3"
          component="h1"
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
          404 — {t.notFound.title}
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          {t.notFound.body}
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
            {t.notFound.home}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            LinkComponent={Link}
            href="/search"
            sx={{ borderRadius: 9999 }}
          >
            {t.notFound.explore}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
