"use client";

import { FC, memo } from "react";
import { Box, Stack } from "@mui/material";
import VerifiedBadge from "@/components/profile/shared/Badge";
import EditableText from "@/components/shared/EditableText";
import EditableAvatar from "./EditableAvatar";

export interface EditableProfileHeaderProps {
  name: string;
  headline: string;
  location?: string;
  verified: boolean;
  avatarUrl: string;
  onUpdate: (field: "name" | "headline" | "location" | "avatarUrl", value: string) => void;
}

const EditableProfileHeader: FC<EditableProfileHeaderProps> = ({
  name,
  headline,
  location,
  verified,
  avatarUrl,
  onUpdate,
}) => {
  return (
    <Box component="header" aria-label="Edit Profile Header" sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <EditableAvatar
            src={avatarUrl}
            alt={`${name} avatar`}
            onUpload={(newUrl) => onUpdate("avatarUrl", newUrl)}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <EditableText
              value={name}
              onChange={(val) => onUpdate("name", val)}
              variant="h5"
              component="h1"
              label="Full Name"
              sx={{ fontWeight: "bold" }}
            />
            <VerifiedBadge visible={verified} />
          </Stack>

          <EditableText
            value={headline}
            onChange={(val) => onUpdate("headline", val)}
            variant="subtitle1"
            component="p"
            label="Headline"
            textSx={{ color: "text.secondary" }}
          />

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <EditableText
              value={location || ""}
              onChange={(val) => onUpdate("location", val)}
              variant="body2"
              label="Location"
              placeholder="Add location"
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default memo(EditableProfileHeader);
