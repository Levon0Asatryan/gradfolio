import { type FC } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";

/** What an owner sees in an empty section: say why it matters, offer the one next step. */
export const EmptyPrompt: FC<{
  title: string;
  hint: string;
  actionLabel: string;
  onAction: () => void;
}> = ({ title, hint, actionLabel, onAction }) => (
  <Stack
    spacing={1.25}
    alignItems="flex-start"
    sx={(theme) => ({
      p: 2.25,
      borderRadius: "16px",
      border: `2px dashed ${theme.palette.surface.lineStrong}`,
      bgcolor: theme.palette.surface.soft,
    })}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {hint}
    </Typography>
    <Button variant="outlined" startIcon={<AddIcon />} onClick={onAction}>
      {actionLabel}
    </Button>
  </Stack>
);
