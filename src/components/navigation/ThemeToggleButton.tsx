"use client";

import { FC, memo, useContext } from "react";
import { ListItemButton, ListItemIcon, Typography, Box } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { DarkModeContext } from "@/components/theme/ThemeWrapper";

export interface ThemeToggleButtonProps {
  collapsed?: boolean;
}

const getButtonSx = (collapsed: boolean) => (theme: any) => ({
  px: 1,
  py: 0.5,
  minHeight: 40,
  justifyContent: collapsed ? "center" : "flex-start",
  borderRadius: 1,
  color: theme.palette.text.secondary,
  transition: "all 0.3s ease",
  "& .MuiListItemIcon-root": {
    minWidth: collapsed ? 0 : "auto",
    mr: collapsed ? 0 : 1.5,
    color: "inherit",
  },
  "&:hover": {
    bgcolor: theme.palette.action.hover,
    transform: "translateY(-1px)",
  },
});

const ThemeToggleButton: FC<ThemeToggleButtonProps> = ({ collapsed = false }) => {
  const { mode, toggleMode } = useContext(DarkModeContext);
  const isDark = mode === "dark";

  return (
    <ListItemButton
      onClick={toggleMode}
      sx={getButtonSx(collapsed)}
    >
      <ListItemIcon>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            width: 20,
            height: 20,
          }}
        >
          {/* Sun Icon */}
          <Box
            component="span"
            sx={{
              position: "absolute",
              display: "flex",
              opacity: isDark ? 0 : 1,
              transform: isDark ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <LightModeIcon fontSize="small" />
          </Box>
          {/* Moon Icon */}
          <Box
            component="span"
            sx={{
              position: "absolute",
              display: "flex",
              opacity: isDark ? 1 : 0,
              transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <DarkModeIcon fontSize="small" />
          </Box>
        </Box>
      </ListItemIcon>
      {!collapsed && (
        <Typography variant="body2" fontWeight="medium">
          {isDark ? "Light Mode" : "Dark Mode"}
        </Typography>
      )}
    </ListItemButton>
  );
};

export default memo(ThemeToggleButton);
