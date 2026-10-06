import { type FC, type ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/**
 * Outer frame of the account and settings pages. The layout's main landmark has no padding
 * of its own, so the page owns the gutter: theme.spacing 2 on a phone, 3 from sm, 4
 * from md; content is centred and capped so wide screens stay readable.
 */
export const pageSx = {
  p: { xs: 2, sm: 3, md: 4 },
  maxWidth: 1200,
  mx: "auto",
  width: "100%",
} as const;

/** Section card shared by the account page: one outlined surface per topic. */
export const AccountCard: FC<{
  title: string;
  help?: string;
  color?: "error";
  className?: string;
  children: ReactNode;
}> = ({ title, help, color, className, children }) => (
  <Paper
    component="section"
    className={className}
    variant="outlined"
    aria-label={title}
    sx={{
      p: { xs: 2, sm: 3 },
      borderRadius: 3,
      ...(color === "error" && { borderColor: "error.main" }),
    }}
  >
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h6" component="h2" color={color}>
          {title}
        </Typography>
        {help && (
          <Typography variant="body2" color="text.secondary">
            {help}
          </Typography>
        )}
      </Stack>
      {children}
    </Stack>
  </Paper>
);
