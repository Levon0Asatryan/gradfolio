"use client";

import { FC, memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from "@mui/material";
import Tag from "./shared/Tag";
import HighlightedText from "@/components/shared/HighlightedText";
import type { ProjectDetailData } from "@/data/project.mock";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ProjectCardProps {
  project: ProjectDetailData;
  highlightQuery?: string;
}

// Helper to highlight matching text
// Replaced by src/components/shared/HighlightedText.tsx

function truncate(text: string, max = 160) {
  if (!text) return "";
  if (text.length <= max) return text;
  const sliced = text.slice(0, max);
  const cut = sliced.lastIndexOf(" ");
  return (cut > 0 ? sliced.slice(0, cut) : sliced).trimEnd() + "…";
}

const categoryColor: Record<
  string,
  "default" | "primary" | "secondary" | "success" | "warning" | "info" | "error"
> = {
  course: "info",
  personal: "success",
  research: "secondary",
  hackathon: "warning",
  other: "default",
  "N/A": "default",
};

function formatDate(date?: string) {
  if (!date) return undefined;
  const d = new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

const cardSx = (theme: any) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[4],
    borderColor: "primary.main",
    "& .hero-image": {
      transform: "scale(1.05)",
    },
  },
});

const ProjectCard: FC<ProjectCardProps> = ({ project, highlightQuery }) => {
  const { id, title, aiSummary, heroImageUrl, technologies, metadata } = project;
  const href = `/projects/${id}`;
  const { t } = useLanguage();

  const { visibleTags, remainingCount } = useMemo(() => {
    const maxTags = 4;
    const visible = (technologies ?? []).slice(0, maxTags);
    const remaining = Math.max(0, (technologies?.length ?? 0) - visible.length);
    return { visibleTags: visible, remainingCount: remaining };
  }, [technologies]);

  const start = formatDate(metadata?.startDate);
  const end = formatDate(metadata?.endDate);
  const range =
    start || end
      ? `${start ?? ""}${start || end ? " – " : ""}${end ?? t.common.present}`
      : undefined;
  const cat = metadata?.category ?? "other";

  return (
    <Card variant="outlined" component="article" aria-label={`Project ${title}`} sx={cardSx}>
      <CardActionArea
        component={Link}
        href={href}
        aria-label={`Open ${title}`}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          textAlign: "inherit",
        }}
      >
        {/* Hero image */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 160,
            bgcolor: "action.hover",
            overflow: "hidden", // Ensure image zoom doesn't overflow
          }}
        >
          {heroImageUrl ? (
            <Image
              unoptimized
              src={heroImageUrl}
              alt={`${title} hero image`}
              fill
              className="hero-image" // Add class for hover targeting
              sizes="(max-width: 600px) 100vw, 33vw"
              style={{
                objectFit: "cover",
                transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)", // Smooth zoom
              }}
            />
          ) : (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                No image
              </Typography>
            </Box>
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            {cat && (
              <Chip
                size="small"
                label={t.projects.categories[cat as keyof typeof t.projects.categories] || cat}
                color={categoryColor[cat] ?? "default"}
                aria-label={`Category ${cat}`}
              />
            )}
            {range && (
              <Typography
                variant="caption"
                color="text.secondary"
                aria-label={`Date range ${range}`}
              >
                {range}
              </Typography>
            )}
          </Stack>

          <Typography
            variant="h6"
            component="h3"
            sx={{
              mb: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
              py: 0.2, // Add small vertical padding to container to show highlight edges
            }}
          >
            <HighlightedText text={title} query={highlightQuery} />
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {truncate(aiSummary, 170)}
          </Typography>

          {visibleTags.length > 0 && (
            <Stack direction="row" flexWrap="wrap" sx={{ mb: 1 }}>
              {visibleTags.map((t) => (
                <Tag key={t} label={<HighlightedText text={t} query={highlightQuery} />} />
              ))}
              {remainingCount > 0 && (
                <Chip
                  size="small"
                  label={`+${remainingCount}`}
                  aria-label={`${remainingCount} more technologies`}
                />
              )}
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default memo(ProjectCard);
