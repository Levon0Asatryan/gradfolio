"use client";

import { FC, memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from "@mui/material";
import Tag from "./shared/Tag";
import type { ProjectDetailData } from "@/data/project.mock";

export interface ProjectCardProps {
  project: ProjectDetailData;
}

const externalLoader = ({ src }: { src: string }) => src;

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
};

function formatDate(date?: string) {
  if (!date) return undefined;
  const d = new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  const { id, title, aiSummary, heroImageUrl, technologies, metadata } = project;
  const href = `/projects/${id}`;

  const { visibleTags, remainingCount } = useMemo(() => {
    const maxTags = 4;
    const visible = (technologies ?? []).slice(0, maxTags);
    const remaining = Math.max(0, (technologies?.length ?? 0) - visible.length);
    return { visibleTags: visible, remainingCount: remaining };
  }, [technologies]);

  const start = formatDate(metadata?.startDate);
  const end = formatDate(metadata?.endDate);
  const range =
    start || end ? `${start ?? ""}${start || end ? " – " : ""}${end ?? "Present"}` : undefined;
  const cat = metadata?.category ?? "other";

  return (
    <Card
      variant="outlined"
      component="article"
      aria-label={`Project ${title}`}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardActionArea
        component={Link}
        href={href}
        aria-label={`Open ${title}`}
        sx={{ alignItems: "stretch", display: "block" }}
      >
        {/* Hero image */}
        <Box sx={{ position: "relative", width: "100%", height: 160, bgcolor: "action.hover" }}>
          {heroImageUrl ? (
            <Image
              loader={externalLoader}
              src={heroImageUrl}
              alt={`${title} hero image`}
              fill
              sizes="(max-width: 600px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
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
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            {cat && (
              <Chip
                size="small"
                label={cat}
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
            }}
          >
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {truncate(aiSummary, 170)}
          </Typography>

          {visibleTags.length > 0 && (
            <Stack direction="row" flexWrap="wrap" sx={{ mb: 1 }}>
              {visibleTags.map((t) => (
                <Tag key={t} label={t} />
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
