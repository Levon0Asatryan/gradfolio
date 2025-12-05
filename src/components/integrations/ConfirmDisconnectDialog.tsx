"use client";

import { memo, type FC, useCallback } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

export interface ConfirmDisconnectDialogProps {
  open: boolean;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * ConfirmDisconnectDialog
 * Asks for confirmation before disconnecting an integration.
 */
const ConfirmDisconnectDialog: FC<ConfirmDisconnectDialogProps> = ({
  open,
  name,
  onCancel,
  onConfirm,
}) => {
  const handleClose = useCallback((): void => {
    onCancel();
  }, [onCancel]);

  const handleCancel = useCallback((): void => {
    onCancel();
  }, [onCancel]);

  const handleConfirm = useCallback((): void => {
    onConfirm();
  }, [onConfirm]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Disconnect {name}?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to disconnect {name}? You can reconnect at any time. Imported data
          will remain, but the verification badge might be removed from your profile.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Disconnect
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(ConfirmDisconnectDialog);
