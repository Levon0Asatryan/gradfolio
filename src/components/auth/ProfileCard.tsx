"use client";

import { memo, type FC } from "react";
import Image from "next/image";
import { Stack, Typography, Card, Skeleton, type SxProps, type Theme } from "@mui/material";
import { useUser } from "@auth0/nextjs-auth0";

export interface ProfileCardProps {
  collapsed?: boolean;
}

const cardSx: SxProps<Theme> = (theme) => ({
  p: 1,
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  bgcolor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
  borderRadius: 2,
  overflow: "hidden",
});

const textStackSx: SxProps<Theme> = {
  minWidth: 0,
  flex: 1,
};

const ProfileCard: FC<ProfileCardProps> = ({ collapsed = false }) => {
  const { user, isLoading, error } = useUser();

  if (isLoading) {
    return (
      <Card sx={cardSx}>
        <Skeleton variant="circular" width={32} height={32} />
        {!collapsed && (
          <Stack sx={textStackSx}>
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="50%" height={16} />
          </Stack>
        )}
      </Card>
    );
  }

  if (error || !user) {
    return null;
  }

  const { name, email, picture } = user;

  return (
    <Card sx={cardSx}>
      {picture ? (
        <Image
          src={picture}
          alt={name || "User"}
          width={32}
          height={32}
          style={{ borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <Skeleton variant="circular" width={32} height={32} />
      )}

      {!collapsed && (
        <Stack sx={textStackSx}>
          <Typography variant="subtitle2" noWrap fontWeight="medium">
            {name || "User"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {email}
          </Typography>
        </Stack>
      )}
    </Card>
  );
};

export default memo(ProfileCard);
