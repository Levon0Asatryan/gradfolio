"use client";

import { memo, type FC } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ConnectIntegrationDialogProps {
  open: boolean;
  name: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** A confirmation dialog shown before connecting an integration. */
const ConnectIntegrationDialog: FC<ConnectIntegrationDialogProps> = ({
  open,
  name,
  description,
  onCancel,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const d = t.integrations.dialog;

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{d.connectTitle.replace("{name}", name)}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {d.connectBody.replace("{name}", name)}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} color="inherit">
          {d.cancel}
        </Button>
        <Button onClick={onConfirm} variant="contained">
          {t.integrations.connect}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(ConnectIntegrationDialog);
