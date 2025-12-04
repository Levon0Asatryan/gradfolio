"use client";

import { FC, memo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import Image from "next/image";
import type { RepoInfo } from "@/data/project.mock";

export interface ProjectHeaderProps {
  title: string;
  aiSummary: string;
  heroImageUrl?: string;
  repo?: RepoInfo;
  liveDemoUrl?: string;
}

const ProjectHeader: FC<ProjectHeaderProps> = ({
  title,
  aiSummary,
  heroImageUrl,
  repo,
  liveDemoUrl,
}) => {
  return (
    <Box component="header" aria-label="Project Header" sx={{ mb: 3 }}>
      {heroImageUrl && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            borderRadius: 1,
            overflow: "hidden",
            aspectRatio: "16 / 9",
            mb: 2,
          }}
        >
          <Image
            src={heroImageUrl}
            alt={`${title} hero image`}
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        </Box>
      )}

      <Typography variant="h4" component="h1" sx={{ mb: 1, wordBreak: "break-word" }}>
        {title}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        {aiSummary}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {repo?.url && (
          <Button
            variant="contained"
            color="primary"
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View GitHub repository"
          >
            GitHub Repo
          </Button>
        )}
        {liveDemoUrl && (
          <Button
            variant="outlined"
            href={liveDemoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open live demo"
          >
            Live Demo
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default memo(ProjectHeader);
