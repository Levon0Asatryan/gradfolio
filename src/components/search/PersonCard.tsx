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
import { useLanguage } from "@/components/i18n/LanguageContext";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";
import type { PersonSummary } from "@/lib/api/types";

const MAX_SKILLS = 3;

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * A person in the results: one link to the profile. Skills are plain chips here, because a
 * link inside a link is invalid and a trap for a screen reader; the profile page links them.
 */
const PersonCard: FC<{ person: PersonSummary; highlightQuery?: string }> = ({
  person,
  highlightQuery,
}) => {
  const { t } = useLanguage();
  const nameId = useId();
  const { id, name, headline, avatarUrl, verified, skills, projectCount, location } = person;

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
          <Avatar src={safeHttpsUrl(avatarUrl)} alt="" sx={{ width: 64, height: 64, flex: "none" }}>
            {name.trim().charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography id={nameId} variant="h6" component="h3" sx={{ overflowWrap: "anywhere" }}>
                <HighlightedText text={name} query={highlightQuery} />
              </Typography>
              <VerifiedBadge visible={verified} label={t.search.verified} />
            </Box>
            {headline && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  overflowWrap: "anywhere",
                }}
              >
                <HighlightedText text={headline} query={highlightQuery} />
              </Typography>
            )}
            {location && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ overflowWrap: "anywhere" }}
              >
                {location}
              </Typography>
            )}
          </Box>
        </Box>

        {skills.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
            {skills.slice(0, MAX_SKILLS).map((skill) => (
              <Chip
                key={skill}
                size="small"
                variant="outlined"
                label={<HighlightedText text={skill} query={highlightQuery} />}
              />
            ))}
            {skills.length > MAX_SKILLS && (
              <Typography variant="caption" color="text.secondary">
                +{skills.length - MAX_SKILLS}
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: "auto" }}>
          {fill(t.search.projectCount, { count: String(projectCount) })}
        </Typography>
      </CardActionArea>
    </Card>
  );
};

export default memo(PersonCard);
