"use client";

import { memo, type FC, useCallback } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";

export interface ConnectIntegrationDialogProps {
  open: boolean;
  name: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const contentSx: SxProps<Theme> = (theme) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.25),
});

/**
 * ConnectIntegrationDialog
 * A confirmation dialog shown before connecting an integration.
 */
const ConnectIntegrationDialog: FC<ConnectIntegrationDialogProps> = ({
  open,
  name,
  description,
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
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Connect {name}</DialogTitle>
      <DialogContent sx={contentSx}>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          By connecting {name}, you enable data import and a verification badge on your profile. You
          can disconnect at any time.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="contained">
            Connect
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default memo(ConnectIntegrationDialog);
