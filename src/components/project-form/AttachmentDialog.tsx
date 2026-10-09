"use client";

import { FC, FormEvent, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { UploadControl } from "@/components/uploads/UploadControl";
import { projectFieldError } from "./errorText";
import type { FieldErrors } from "@/lib/profile/headerPatch";
import {
  ATTACHMENT_TYPES,
  parseAttachment,
  type AttachmentType,
  type AttachmentValues,
} from "@/lib/projects/attachments";
import { signUploadAction } from "@/lib/uploads/actions";

export interface AttachmentDialogProps {
  open: boolean;
  /** Present when editing: the type is then fixed (API: the type cannot change). */
  editing?: AttachmentValues;
  /** Present when the project exists; absent on a new project (uploads still work). */
  projectId?: string;
  /** Saves; returns the API's field errors or a message key to keep the dialog open, or null when done. */
  onSubmit: (
    values: AttachmentValues,
  ) => Promise<{ fields?: FieldErrors; message?: string } | null>;
  onClose: () => void;
}

const EMPTY: AttachmentValues = { type: "link", url: "", title: "" };

export const AttachmentDialog: FC<AttachmentDialogProps> = ({
  open,
  editing,
  projectId,
  onSubmit,
  onClose,
}) => {
  const { t } = useLanguage();
  const text = t.projects.upload;
  const [values, setValues] = useState<AttachmentValues>(editing ?? EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const typeLabel: Record<AttachmentType, string> = {
    image: text.typeImage,
    video: text.typeVideo,
    pdf: text.typePdf,
    link: text.typeLink,
  };
  const err = (key: string) => {
    const e = errors[key];
    if (!e) return undefined;
    return e === "invalid_host" ? text.attachmentErrorHost : projectFieldError(t, key, e);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    // The dialog is portalled out of the page, but React still bubbles this event to the
    // project form that contains it: without this, adding an attachment saved the project.
    event.stopPropagation();
    if (busy) return;
    const checked = parseAttachment(values);
    if (!checked.ok) {
      setErrors(checked.errors);
      return;
    }
    setErrors({});
    setMessage(null);
    setBusy(true);
    try {
      const outcome = await onSubmit(values);
      if (outcome === null) return;
      if (outcome.fields) setErrors(outcome.fields);
      setMessage(outcome.message ?? text.attachmentErrorSave);
    } catch {
      setMessage(text.attachmentErrorSave);
    } finally {
      setBusy(false);
    }
  }

  // Only images and PDFs are files. On a new project there is no id yet: the upload is keyed by the user.
  const uploadKind = values.type === "image" ? "image" : values.type === "pdf" ? "pdf" : null;

  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      fullWidth
      maxWidth="sm"
      aria-labelledby="attachment-dialog-title"
    >
      <form onSubmit={submit} noValidate>
        <DialogTitle id="attachment-dialog-title">
          {editing ? text.attachmentSave : text.addAttachment}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {message && (
              <Alert severity="error" role="alert">
                {message}
              </Alert>
            )}
            <TextField
              select
              size="small"
              label={text.attachmentType}
              value={values.type}
              disabled={Boolean(editing)}
              onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as AttachmentType }))}
            >
              {ATTACHMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {typeLabel[type]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="url"
              autoFocus
              label={text.attachmentUrl}
              placeholder="https://"
              value={values.url}
              onChange={(e) => setValues((v) => ({ ...v, url: e.target.value }))}
              error={Boolean(errors.url)}
              helperText={err("url")}
            />
            {uploadKind && (
              <UploadControl
                key={uploadKind}
                kind={uploadKind}
                sign={(req) =>
                  signUploadAction({
                    ...req,
                    purpose: "attachment",
                    ...(projectId ? { projectId } : {}),
                  })
                }
                onUploaded={(fileUrl) => setValues((v) => ({ ...v, url: fileUrl }))}
              />
            )}
            <TextField
              size="small"
              label={text.attachmentTitle}
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              error={Boolean(errors.title)}
              helperText={err("title")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            {t.projects.form.cancel}
          </Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {editing ? text.attachmentSave : text.attachmentAdd}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
