import { type FC, type ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

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
