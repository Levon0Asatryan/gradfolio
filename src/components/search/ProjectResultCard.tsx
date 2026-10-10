"use client";

import { FC, memo, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import HighlightedText from "@/components/shared/HighlightedText";
import { CategoryChip, isProjectCategory } from "@/components/shared/CategoryChip";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";
import type { DiscoveryProject } from "@/lib/api/types";

const MAX_TAGS = 4;

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A published project in the results: one link to the project. Technologies are plain chips. */
const ProjectResultCard: FC<{ project: DiscoveryProject; highlightQuery?: string }> = ({
  project,
  highlightQuery,
}) => {
  const { t } = useLanguage();
  const titleId = useId();
  const { id, title, summary, technologies, owner } = project;
  const heroImageUrl = safeHttpsUrl(project.heroImageUrl);
  const category = isProjectCategory(project.category) ? project.category : "other";
  const shown = technologies.slice(0, MAX_TAGS);

  return (
    <Card
      component="article"
      sx={{ display: "flex", minWidth: 0, "&:hover": { borderColor: "primary.main" } }}
    >
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
            <Typography variant="caption" color="text.secondary">
              {t.projects.status[project.status] ?? project.status}
            </Typography>
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
          {summary && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                overflowWrap: "anywhere",
              }}
            >
              <HighlightedText text={summary} query={highlightQuery} />
            </Typography>
          )}
          {shown.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {shown.map((tech) => (
                <Chip
                  key={tech}
                  size="small"
                  variant="outlined"
                  label={<HighlightedText text={tech} query={highlightQuery} />}
                />
              ))}
            </Box>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: "auto", overflowWrap: "anywhere" }}
          >
            {fill(t.search.byOwner, { name: owner.name })}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default memo(ProjectResultCard);
