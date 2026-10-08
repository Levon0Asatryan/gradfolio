"use client";

import { FC, memo, ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import CloseIcon from "@mui/icons-material/Close";

export interface DetailDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const DetailDialog: FC<DetailDialogProps> = ({ open, title, onClose, children }) => {
  const { t } = useLanguage();
  const titleId = "dialog-title-" + title.replace(/\s+/g, "-").toLowerCase();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="md">
      <DialogTitle id={titleId} sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label={t.common.close}
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
