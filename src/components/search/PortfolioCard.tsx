"use client";

import { FC, memo, useId } from "react";
import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import VerifiedBadge from "@/components/profile/shared/Badge";
import HighlightedText from "@/components/shared/HighlightedText";
import { CategoryChip } from "@/components/shared/CategoryChip";
import { useLanguage } from "@/components/i18n/LanguageContext";

import type { ProfileData } from "@/data/profile.mock";

export interface PortfolioCardProps {
  profile: ProfileData;
  highlightQuery?: string;
}

/**
 * A portfolio in the results. The hover is a colour change only: a card that
 * lifts on hover moves out from under a pointer resting on its bottom edge,
 * loses the hover, drops back, regains it, and flickers without end.
 */
const PortfolioCard: FC<PortfolioCardProps> = ({ profile, highlightQuery }) => {
  const { t } = useLanguage();
  const nameId = useId();
  const { id, name, headline, avatarUrl, verified, skills, projects } = profile;

  return (
    <Card
      component="article"
      sx={{ display: "flex", minWidth: 0, "&:hover": { borderColor: "primary.main" } }}
    >
      <CardActionArea
        component={Link}
        href={`/profile/${id}`}
        aria-labelledby={nameId}
        sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 2 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={avatarUrl} alt="" sx={{ width: 64, height: 64, flex: "none" }} />
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography id={nameId} variant="h6" component="h2" sx={{ overflowWrap: "anywhere" }}>
                <HighlightedText text={name} query={highlightQuery} />
              </Typography>
              <VerifiedBadge visible={verified} />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              <HighlightedText text={headline} query={highlightQuery} />
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          {skills.slice(0, 3).map((skill) => (
            <Chip
              key={skill}
              size="small"
              variant="outlined"
              label={<HighlightedText text={skill} query={highlightQuery} />}
            />
          ))}
          {skills.length > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{skills.length - 3}
            </Typography>
          )}
        </Box>

        {projects.length > 0 && (
          <Box sx={{ mt: "auto", pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="overline" color="text.secondary" component="p" sx={{ mb: 1 }}>
              {t.search.featuredProjects}
            </Typography>
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1 }}>
              {projects.slice(0, 2).map((p) => (
                <Box
                  component="li"
                  key={p.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography variant="body2" noWrap sx={{ fontWeight: 700, minWidth: 0 }}>
                    <HighlightedText text={p.name} query={highlightQuery} />
                  </Typography>
                  <CategoryChip category={p.category} />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardActionArea>
    </Card>
  );
};

export default memo(PortfolioCard);
