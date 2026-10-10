"use client";

import { FC, memo, useId, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Tag from "./shared/Tag";
import HighlightedText from "@/components/shared/HighlightedText";
import { CategoryChip, isProjectCategory } from "@/components/shared/CategoryChip";
import type { ProjectSummary } from "@/lib/api/types";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";
import { formatMonth } from "@/utils/helpers/formatDay";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ProjectCardProps {
  project: ProjectSummary;
  highlightQuery?: string;
}

const MAX_TAGS = 4;

function truncate(text: string, max = 160) {
  if (!text) return "";
  if (text.length <= max) return text;
  const sliced = text.slice(0, max);
  const cut = sliced.lastIndexOf(" ");
  return (cut > 0 ? sliced.slice(0, cut) : sliced).trimEnd() + "…";
}

const ProjectCard: FC<ProjectCardProps> = ({ project, highlightQuery }) => {
  const { id, title, summary, technologies, metadata, category: rawCategory } = project;
  const heroImageUrl = safeHttpsUrl(project.heroImageUrl);
  const { t, language } = useLanguage();
  const titleId = useId();

  const { visibleTags, remainingCount } = useMemo(() => {
    const visible = technologies.slice(0, MAX_TAGS);
    return {
      visibleTags: visible,
      remainingCount: Math.max(0, technologies.length - visible.length),
    };
  }, [technologies]);

  const start = metadata.startDate ? formatMonth(metadata.startDate, language) : undefined;
  const end = metadata.endDate ? formatMonth(metadata.endDate, language) : undefined;
  const range = start || end ? `${start ?? ""} – ${end ?? t.common.present}` : undefined;
  const category = isProjectCategory(rawCategory) ? rawCategory : "other";

  return (
    <Card component="article" sx={{ display: "flex", minWidth: 0 }}>
      <CardActionArea
        component={Link}
        href={`/projects/${id}`}
        aria-labelledby={titleId}
        sx={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <Box
          aria-hidden
          sx={({ palette }) => ({
            position: "relative",
            height: 144,
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            color: palette.category[category].fg,
            bgcolor: palette.category[category].bg,
            fontSize: "2.5rem",
            fontWeight: 800,
          })}
        >
          {heroImageUrl ? (
            <Image
              unoptimized
              src={heroImageUrl}
              alt=""
              fill
              sizes="(max-width: 600px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            title.trim().charAt(0).toUpperCase()
          )}
        </Box>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
            <CategoryChip category={category} />
            {project.isDraft ? (
              <Chip size="small" variant="outlined" label={t.projects.draft} />
            ) : !project.isPublic ? (
              <Chip size="small" variant="outlined" label={t.projects.private} />
            ) : null}
            {range && (
              // The month names come from the machine's ICU data: the server may have Armenian,
              // the browser not. Keep the server's text rather than report a mismatch.
              <Typography variant="caption" color="text.secondary" suppressHydrationWarning>
                {range}
              </Typography>
            )}
          </Box>
          <Typography
            id={titleId}
            variant="h6"
            component="h3"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "anywhere",
            }}
          >
            <HighlightedText text={title} query={highlightQuery} />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {truncate(summary ?? "", 170)}
          </Typography>
          {visibleTags.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: "auto" }}>
              {visibleTags.map((tag) => (
                <Tag key={tag} label={<HighlightedText text={tag} query={highlightQuery} />} />
              ))}
              {remainingCount > 0 && (
                <Chip
                  size="small"
                  label={`+${remainingCount}`}
                  aria-label={t.projects.moreTech.replace("{count}", String(remainingCount))}
                />
              )}
            </Box>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default memo(ProjectCard);
