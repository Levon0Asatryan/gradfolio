"use client";

import { FC, memo } from "react";
import { Box, Button, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { LayoutGroup } from "motion/react";
import PortfolioCard from "./PortfolioCard";
import type { ProfileData } from "@/data/profile.mock";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ResultsGridProps {
  portfolios: ProfileData[];
  searchQuery?: string;
}

const ResultsGrid: FC<ResultsGridProps> = ({ portfolios, searchQuery }) => {
  const { t } = useLanguage();

  if (portfolios.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 8,
          px: 2,
        }}
      >
        <Typography variant="h6" color="text.primary" gutterBottom>
          {t.search.noResults}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t.search.tryAdjusting}
        </Typography>
        <Button variant="outlined" color="secondary" onClick={() => window.location.reload()}>
          {t.search.clearFilters}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, pb: 8 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
        {t.search.showingResults
          .replace("{count}", portfolios.length.toString())
          .replace("{s}", portfolios.length !== 1 ? "s" : "")}
      </Typography>
      <Grid container spacing={3}>
        <LayoutGroup>
          {portfolios.map((profile) => (
            <Grid key={profile.id} size={{ xs: 12, sm: 6, md: 4 }} component={Box}>
              <PortfolioCard profile={profile} highlightQuery={searchQuery} />
            </Grid>
          ))}
        </LayoutGroup>
      </Grid>
    </Box>
  );
};

export default memo(ResultsGrid);
