"use client";

import { FC, memo, useMemo, useState } from "react";
import { Box, Container } from "@mui/material";
import SearchHeader from "./SearchHeader";
import FilterBar from "./FilterBar";
import ResultsGrid from "./ResultsGrid";
import { portfoliosMock } from "@/data/portfolios.mock";

const ExplorePage: FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPortfolios = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const category = activeCategory.toLowerCase();

    return portfoliosMock.filter((profile) => {
      // 1. Filter by Category (Role mapping logic)
      // Categories: Developers, Designers, Product Managers, Data Scientists, Researchers
      let roleMatch = true;
      if (activeCategory !== "All") {
        // Simple keyword matching against headline/skills/role
        // This is heuristics based since mock data doesn't have explicit "Role" field always matching.
        // We check headline or explicit role strings.
        const content = (profile.headline + " " + (profile.skills || []).join(" ")).toLowerCase();

        // Map UI Category to Keywords
        const keywords: Record<string, string[]> = {
          developers: [
            "developer",
            "engineer",
            "software",
            "full stack",
            "frontend",
            "backend",
            "web",
            "android",
            "ios",
          ],
          designers: ["designer", "ui", "ux", "creative", "art"],
          "product managers": ["product manager", "pm", "product owner"],
          "data scientists": ["data scientist", "analyst", "machine learning", "ai", "nlp"],
          researchers: ["researcher", "scientist", "phd", "academic"],
        };

        const targetKeywords = keywords[category] || [category];
        roleMatch = targetKeywords.some((k) => content.includes(k));
      }

      if (!roleMatch) return false;

      // 2. Filter by Search Query
      if (!query) return true;

      const nameMatch = profile.name.toLowerCase().includes(query);
      const headlineMatch = profile.headline.toLowerCase().includes(query);
      const skillsMatch = profile.skills.some((s) => s.toLowerCase().includes(query));
      const projectsMatch = profile.projects.some(
        (p) => p.name.toLowerCase().includes(query) || p.summary.toLowerCase().includes(query),
      );

      return nameMatch || headlineMatch || skillsMatch || projectsMatch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 6, pb: 10 }}>
      <Container maxWidth="xl">
        <SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <FilterBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

        <ResultsGrid portfolios={filteredPortfolios} searchQuery={searchQuery} />
      </Container>
    </Box>
  );
};

export default memo(ExplorePage);
