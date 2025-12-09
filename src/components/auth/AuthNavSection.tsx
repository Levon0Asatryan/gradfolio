"use client";

import { memo, type FC } from "react";
import { Stack, Divider, type SxProps, type Theme } from "@mui/material";
import { useUser } from "@auth0/nextjs-auth0";
import LoginButton from "./LoginButton";
import SignupButton from "./SignupButton";
import ProfileCard from "./ProfileCard";
import LogoutButton from "./LogoutButton";

export interface AuthNavSectionProps {
  collapsed?: boolean;
}

const stackSx: SxProps<Theme> = {
  width: "100%",
  mt: 2,
  px: 2,
  pb: 2,
  gap: 1,
};

const AuthNavSection: FC<AuthNavSectionProps> = ({ collapsed = false }) => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  // Logged In
  if (user) {
    return (
      <Stack sx={stackSx} spacing={1}>
        <Divider />
        <ProfileCard collapsed={collapsed} />
        <LogoutButton collapsed={collapsed} />
      </Stack>
    );
  }

  // Logged Out
  // Adjust stackSx for ListItemButtons which need less container padding
  return (
    <Stack sx={{ width: "100%", mt: "auto" }}>
      <Divider sx={{ mb: 1, mx: 2 }} />
      <Stack
        direction={collapsed ? "column" : "row"}
        spacing={collapsed ? 1 : 0}
        sx={{ mx: collapsed ? 0 : 1 }}
      >
        <LoginButton collapsed={collapsed} />
        <SignupButton collapsed={collapsed} />
      </Stack>
    </Stack>
  );
};

export default memo(AuthNavSection);
