"use client";

import { memo, type FC } from "react";
import Link from "next/link";
import { MenuItem, ListItemIcon, ListItemText, type SxProps, type Theme } from "@mui/material";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";

export interface LogoutButtonProps {
  collapsed?: boolean;
}

const logoutItemSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.error.main,
  borderRadius: 1,
  "&:hover": {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    "& .MuiListItemIcon-root": {
      color: "inherit",
    },
  },
});

const LogoutButton: FC<LogoutButtonProps> = ({ collapsed = false }) => {
  return (
    <MenuItem
      component={Link}
      href="/auth/logout"
      sx={logoutItemSx}
      disableGutters={collapsed}
    >
      <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, justifyContent: "center" }}>
        <LogoutOutlined fontSize="small" color="inherit" />
      </ListItemIcon>
      {!collapsed && <ListItemText primary="Log out" />}
    </MenuItem>
  );
};

export default memo(LogoutButton);
