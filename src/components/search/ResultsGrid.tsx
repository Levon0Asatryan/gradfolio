"use client";

import { FC, memo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PortfolioCard from "./PortfolioCard";
import type { ProfileData } from "@/data/profile.mock";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ResultsGridProps {
  portfolios: ProfileData[];
  searchQuery?: string;
  /** Resets the search text and the role filter. */
  onClearFilters: () => void;
}

const ResultsGrid: FC<ResultsGridProps> = ({ portfolios, searchQuery, onClearFilters }) => {
  const { t } = useLanguage();

  if (portfolios.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="h6" component="h2">
            {t.search.noResults}
          </Typography>
          <Typography color="text.secondary">{t.search.tryAdjusting}</Typography>
        </Box>
        <Box>
          <Button variant="outlined" onClick={onClearFilters}>
            {t.search.clearFilters}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" role="status">
        {t.search.showingResults.replace("{count}", String(portfolios.length))}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
          gap: 3,
        }}
      >
        {portfolios.map((profile) => (
          <PortfolioCard key={profile.id} profile={profile} highlightQuery={searchQuery} />
        ))}
      </Box>
    </Box>
  );
};

export default memo(ResultsGrid);
