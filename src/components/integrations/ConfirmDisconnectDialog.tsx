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

export interface ConfirmDisconnectDialogProps {
  open: boolean;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Asks for confirmation before disconnecting an integration. */
const ConfirmDisconnectDialog: FC<ConfirmDisconnectDialogProps> = ({
  open,
  name,
  onCancel,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const d = t.integrations.dialog;

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle>{d.disconnectTitle.replace("{name}", name)}?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {d.disconnectBody}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} color="inherit">
          {d.cancel}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {t.integrations.disconnect}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(ConfirmDisconnectDialog);
