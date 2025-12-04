"use client";

import { FC, memo } from "react";
import { Box, Button, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import VerifiedBadge from "./shared/Badge";

export interface ProfileHeaderProps {
  name: string;
  headline: string;
  location?: string;
  verified: boolean;
  email?: string;
  avatarUrl: string;
}

const ProfileHeader: FC<ProfileHeaderProps> = ({
  name,
  headline,
  location,
  verified,
  email,
  avatarUrl,
}) => {
  const theme = useTheme();
  const avatarSize = 96;

  return (
    <Box component="header" aria-label="Profile Header" sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Box
          sx={{
            position: "relative",
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            overflow: "hidden",
            border: `2px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
          aria-hidden
        >
          {/* Using next/image for optimized image loading */}
          <Image
            src={avatarUrl}
            alt={`${name} avatar`}
            fill
            sizes="96px"
            style={{ objectFit: "cover" }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="h5" component="h1" sx={{ wordBreak: "break-word" }}>
              {name}
            </Typography>
            <VerifiedBadge visible={verified} />
          </Stack>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
            {headline}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {location && (
              <Typography variant="body2" aria-label="Location">
                {location}
              </Typography>
            )}
            {email && (
              <Tooltip title={`Contact ${name}`}>
                <Button
                  size="small"
                  variant="outlined"
                  href={`mailto:${email}`}
                  aria-label={`Contact ${name}`}
                >
                  Contact
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default memo(ProfileHeader);
