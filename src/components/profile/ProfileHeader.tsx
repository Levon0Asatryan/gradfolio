"use client";

import { FC, memo } from "react";
import { Alert, Avatar, Box, Button, Link, Stack, Tooltip, Typography } from "@mui/material";
import VerifiedBadge from "./shared/Badge";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { ProfileLinks } from "@/lib/api/types";
import { safeHttpUrl } from "@/utils/helpers/safeHttpUrl";

export interface ProfileHeaderProps {
  name: string;
  headline: string;
  bio: string | null;
  location: string | null;
  verified: boolean;
  contactEmail: string | null;
  avatarUrl: string | null;
  links: ProfileLinks;
  /** Owner viewing a profile nobody else can see. */
  privateNotice?: boolean;
}

const LINK_KEYS = ["github", "linkedin", "twitter", "website"] as const;

const ProfileHeader: FC<ProfileHeaderProps> = ({
  name,
  headline,
  bio,
  location,
  verified,
  contactEmail,
  avatarUrl,
  links,
  privateNotice,
}) => {
  const { t } = useLanguage();
  const visibleLinks = LINK_KEYS.flatMap((key) => {
    const href = safeHttpUrl(links[key]);
    return href ? [{ key, href }] : [];
  });

  return (
    <Box component="header" sx={{ mb: 3 }}>
      {privateNotice && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t.profile.privateNotice}
        </Alert>
      )}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Avatar
          src={safeHttpUrl(avatarUrl)}
          alt={name}
          slotProps={{ img: { referrerPolicy: "no-referrer" } }}
          sx={{ width: 96, height: 96, flexShrink: 0 }}
        >
          {name.trim().charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="h5" component="h1" sx={{ wordBreak: "break-word" }}>
              {name}
            </Typography>
            <VerifiedBadge visible={verified} />
          </Stack>
          {headline && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              {headline}
            </Typography>
          )}
          {bio && (
            <Typography variant="body1" sx={{ mb: 1, whiteSpace: "pre-line" }}>
              {bio}
            </Typography>
          )}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {location && <Typography variant="body2">{location}</Typography>}
            {contactEmail && (
              <Tooltip title={`${t.common.contact} ${name}`}>
                <Button
                  size="small"
                  variant="outlined"
                  href={`mailto:${encodeURIComponent(contactEmail)}`}
                  aria-label={`${t.common.contact} ${name}`}
                >
                  {t.common.contact}
                </Button>
              </Tooltip>
            )}
            {visibleLinks.map(({ key, href }) => (
              <Link key={key} href={href} target="_blank" rel="noopener noreferrer" variant="body2">
                {t.profile.links[key]}
              </Link>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default memo(ProfileHeader);
