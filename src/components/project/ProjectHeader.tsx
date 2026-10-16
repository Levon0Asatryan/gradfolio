"use client";

import SourceBadge from "@/components/shared/SourceBadge";
import { FC, memo } from "react";
import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";
import type { ProjectDetail } from "@/lib/api/types";
import { safeHttpUrl, safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";
import { CategoryChip } from "@/components/shared/CategoryChip";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ProjectHeaderProps {
  title: string;
  summary: string | null;
  category?: string;
  heroImageUrl: string | null;
  repo?: ProjectDetail["repo"];
  source?: ProjectDetail["source"];
  liveDemoUrl: string | null;
}

const ProjectHeader: FC<ProjectHeaderProps> = ({
  title,
  summary,
  category,
  heroImageUrl,
  repo,
  source,
  liveDemoUrl,
}) => {
  const { t } = useLanguage();
  // User-supplied links are rendered only as http(s).
  const repoHref = repo?.url ? safeHttpUrl(repo.url) : undefined;
  const demoHref = liveDemoUrl ? safeHttpUrl(liveDemoUrl) : undefined;
  const heroSrc = safeHttpsUrl(heroImageUrl);

  return (
    <Box component="header" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {heroSrc && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            borderRadius: 5,
            overflow: "hidden",
            aspectRatio: "16 / 9",
            maxHeight: 420,
          }}
        >
          <Image
            src={heroSrc}
            alt=""
            fill
            sizes="(max-width: 1100px) 100vw, 1100px"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        </Box>
      )}

      {(category || source === "github") && (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          {category && <CategoryChip category={category} />}
          <SourceBadge source={source} />
        </Box>
      )}
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontSize: { xs: "1.5625rem", sm: "1.875rem" }, overflowWrap: "anywhere" }}
      >
        {title}
      </Typography>
      {summary && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: "70ch" }}>
          {summary}
        </Typography>
      )}

      {(repoHref || demoHref) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {repoHref && (
            <Button
              component="a"
              variant="contained"
              href={repoHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.common.githubRepo}
            </Button>
          )}
          {demoHref && (
            <Button
              component="a"
              variant="outlined"
              href={demoHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.common.liveDemo}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default memo(ProjectHeader);
