import { type FC, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** The page's one primary action. */
  action?: ReactNode;
}

/** Title, one line of help and the primary action; the same on every page. */
export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <Box
    component="header"
    sx={{
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      alignItems: { xs: "flex-start", sm: "flex-end" },
      justifyContent: "space-between",
      gap: 2,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontSize: { xs: "1.5625rem", sm: "1.875rem" }, overflowWrap: "anywhere" }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: "60ch" }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action && <Box sx={{ flex: "none" }}>{action}</Box>}
  </Box>
);
