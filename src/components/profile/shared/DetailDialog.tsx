"use client";

import { FC, memo, ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export interface DetailDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const DetailDialog: FC<DetailDialogProps> = ({ open, title, onClose, children }) => {
  const titleId = "dialog-title-" + title.replace(/\s+/g, "-").toLowerCase();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="md">
      <DialogTitle id={titleId} sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
};

export default memo(DetailDialog);
