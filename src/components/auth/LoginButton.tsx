"use client";

import { memo, type FC } from "react";
import Link from "next/link";
import {
  ListItemButton,
  ListItemIcon,
  Typography,
  Tooltip,
} from "@mui/material";
import LoginOutlined from "@mui/icons-material/LoginOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface LoginButtonProps {
  collapsed?: boolean;
}

const LoginButton: FC<LoginButtonProps> = ({ collapsed = false }) => {
  const { t } = useLanguage();

  const content = (
    <ListItemButton
      component={Link}
      href="/auth/login"
      sx={(theme) => ({
        px: 1,
        py: 0.5,
        minHeight: 40,
        justifyContent: "center",
        borderRadius: 1,
        // Only flatten corners if NOT collapsed (side-by-side view)
        borderTopRightRadius: collapsed ? 1 : 0,
        borderBottomRightRadius: collapsed ? 1 : 0,
        color: theme.palette.text.secondary,
        transition: "all 0.3s ease",
        flex: collapsed ? "none" : 1,
        width: collapsed ? "100%" : "auto", 
        "& .MuiListItemIcon-root": {
          minWidth: collapsed ? 0 : "auto",
          mr: collapsed ? 0 : 1,
          color: "inherit",
        },
        "& .MuiListItemIcon-root svg": {
          fontSize: 20,
        },
        "&:hover": {
          bgcolor: theme.palette.action.hover,
          transform: "translateY(-1px)",
          zIndex: 1, 
        },
      })}
    >
      <ListItemIcon>
        <LoginOutlined />
      </ListItemIcon>
      {!collapsed && (
        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
          {t.common.loginButton}
        </Typography>
      )}
    </ListItemButton>
  );

  if (collapsed) {
    return (
        <Tooltip title={t.common.loginButton} placement="right">
            {content}
        </Tooltip>
    )
  }

  return content;
};

export default memo(LoginButton);
