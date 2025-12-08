"use client";

import { FC, memo } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { motion } from "motion/react";
import VerifiedBadge from "@/components/profile/shared/Badge";
import HighlightedText from "@/components/shared/HighlightedText";
import { useLanguage } from "@/components/i18n/LanguageContext";

import type { ProfileData } from "@/data/profile.mock";

export interface PortfolioCardProps {
  profile: ProfileData;
  highlightQuery?: string;
}

const PortfolioCard: FC<PortfolioCardProps> = ({ profile, highlightQuery }) => {
  const { t } = useLanguage();
  const theme = useTheme();
  const { id, name, headline, avatarUrl, verified, skills, projects } = profile;

  // Helper to get category label
  const getCategoryLabel = (cat: string) => {
    return t.projects.categories[cat as keyof typeof t.projects.categories] || cat;
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { y: -8, boxShadow: theme.shadows[8] },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      layout
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Card
        variant="outlined"
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
        }}
      >
        <CardActionArea
          component={Link}
          href={`/profile/${id}`}
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar
              src={avatarUrl}
              alt={name}
              sx={{ width: 64, height: 64, mr: 2, border: `2px solid ${theme.palette.divider}` }}
            />
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="h6" fontWeight="bold">
                  <HighlightedText text={name} query={highlightQuery} />
                </Typography>
                <VerifiedBadge visible={verified} />
              </Stack>
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

          <CardContent sx={{ p: 0, width: "100%", flexGrow: 1 }}>
            {/* Top Skills */}
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                {skills.slice(0, 3).map((skill) => (
                  <Chip
                    key={skill}
                    label={<HighlightedText text={skill} query={highlightQuery} />}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 1.5 }}
                  />
                ))}
                {skills.length > 3 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ alignSelf: "center", ml: 0.5 }}
                  >
                    +{skills.length - 3}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Project Snippets */}
            {projects.length > 0 && (
              <Box sx={{ mt: "auto", pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="bold"
                  sx={{ mb: 1, display: "block" }}
                >
                  {t.search.featuredProjects}
                </Typography>
                <Stack spacing={1}>
                  {projects.slice(0, 2).map((p) => (
                    <Box
                      key={p.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500, maxWidth: "70%" }}>
                        <HighlightedText text={p.name} query={highlightQuery} />
                      </Typography>
                      <Chip
                        label={getCategoryLabel(p.category)}
                        size="small"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  );
};

export default memo(PortfolioCard);
