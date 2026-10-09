"use client";

import { FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { ProjectAttachment } from "@/lib/api/types";
import {
  addAttachmentAction,
  deleteAttachmentAction,
  reorderAttachmentsAction,
  updateAttachmentAction,
} from "@/lib/projects/attachmentActions";
import { MAX_ATTACHMENTS, type AttachmentValues } from "@/lib/projects/attachments";
import type { FailedAttachment } from "@/lib/projects/actions";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";
import { AttachmentDialog } from "./AttachmentDialog";

/** Where a create that lost attachments leaves their values for the edit page (client only, never the URL). */
export const failedKey = (projectId: string) => `gradfolio.failedAttachments.${projectId}`;

interface Row {
  id: string;
  type: string;
  url: string;
  title: string;
}

const fromApi = (a: ProjectAttachment): Row => ({
  id: a.id,
  type: a.type,
  url: a.url,
  title: a.title ?? "",
});

export interface AttachmentsEditorProps {
  /** Live mode: the project exists, every change is its own request. */
  projectId?: string;
  initial?: ProjectAttachment[];
  /** Draft mode (a new project): the list is held by the form and sent with its Create. */
  draft?: AttachmentValues[];
  onDraftChange?: (items: AttachmentValues[]) => void;
}

/** What an API failure says; the code is the contract. */
function messageFor(text: ReturnType<typeof useLanguage>["t"]["projects"]["upload"], code: string) {
  switch (code) {
    case "INVALID_FILE":
    case "FILE_IN_USE":
      return text.attachmentErrorFile;
    case "LIMIT_REACHED":
      return text.attachmentErrorLimit;
    case "ORDER_STALE":
      return text.attachmentErrorStale;
    case "NOT_FOUND":
      return text.attachmentErrorGone;
    default:
      return text.attachmentErrorSave;
  }
}

/**
 * The Media section. On a saved project every add, change, removal and move is its own
 * request and shows its result at once; on a new project the list is kept in the form and
 * created with it. Reordering is by up and down buttons (a keyboard and touch path, no
 * drag-only control).
 */
export const AttachmentsEditor: FC<AttachmentsEditorProps> = ({
  projectId,
  initial = [],
  draft,
  onDraftChange,
}) => {
  const { t } = useLanguage();
  const text = t.projects.upload;
  const router = useRouter();
  const live = projectId !== undefined;
  const [rows, setRows] = useState<Row[]>(() => initial.map(fromApi));
  const [dialog, setDialog] = useState<{ editing?: number } | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<FailedAttachment[]>([]);

  // Attachments a create could not save come back here (client storage, set by the create form).
  useEffect(() => {
    if (!projectId) return;
    try {
      const raw = sessionStorage.getItem(failedKey(projectId));
      if (!raw) return;
      sessionStorage.removeItem(failedKey(projectId));
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFailed(
          parsed.filter(
            (x): x is FailedAttachment =>
              typeof x === "object" &&
              x !== null &&
              typeof (x as FailedAttachment).url === "string" &&
              typeof (x as FailedAttachment).type === "string",
          ),
        );
      }
    } catch {
      // Storage can be blocked; the user can add the attachments again by hand.
    }
  }, [projectId]);

  const items: Row[] = live
    ? rows
    : (draft ?? []).map((d, i) => ({ id: String(i), type: d.type, url: d.url, title: d.title }));
  const typeLabel = (type: string) =>
    ({ image: text.typeImage, video: text.typeVideo, pdf: text.typePdf, link: text.typeLink })[
      type as "image"
    ] ?? type;
  const nameOf = (r: Row) =>
    r.title || text.attachmentUntitled.replace("{type}", typeLabel(r.type));

  async function run<T>(op: () => Promise<{ ok: true; value: T } | { ok: false; code: string }>) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const result = await op();
      if (result.ok) return result.value;
      setError(messageFor(text, result.code));
      // The list or the project changed elsewhere: show the server's version.
      if (result.code === "ORDER_STALE" || result.code === "NOT_FOUND") router.refresh();
    } catch {
      setError(text.attachmentErrorSave);
    } finally {
      setBusy(false);
    }
    return undefined;
  }

  async function submitDialog(values: AttachmentValues) {
    const editing = dialog?.editing;
    if (!live) {
      const next = [...(draft ?? [])];
      if (editing === undefined) next.push(values);
      else next[editing] = { ...values, type: next[editing]?.type ?? values.type };
      onDraftChange?.(next);
      setDialog(null);
      return null;
    }
    const target = editing === undefined ? undefined : rows[editing];
    const result = target
      ? await updateAttachmentAction(projectId, target.id, values)
      : await addAttachmentAction(projectId, values);
    if (!result.ok) return { fields: result.fields, message: messageFor(text, result.code) };
    const row = fromApi(result.value);
    setRows((prev) => (target ? prev.map((r) => (r.id === target.id ? row : r)) : [...prev, row]));
    setDialog(null);
    return null;
  }

  async function move(index: number, by: -1 | 1) {
    const to = index + by;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    if (!live) {
      const d = [...(draft ?? [])];
      const [m] = d.splice(index, 1);
      if (m) d.splice(to, 0, m);
      onDraftChange?.(d);
    } else {
      const value = await run(() =>
        reorderAttachmentsAction(
          projectId,
          next.map((r) => r.id),
        ),
      );
      if (!value) return;
      setRows(value.map(fromApi));
    }
    setStatus(
      text.attachmentMoved.replace("{n}", String(to + 1)).replace("{m}", String(items.length)),
    );
  }

  async function remove(index: number) {
    if (!live) {
      onDraftChange?.((draft ?? []).filter((_d, i) => i !== index));
      setRemoving(null);
      return;
    }
    const target = rows[index];
    if (!target) return;
    const value = await run(() => deleteAttachmentAction(projectId, target.id));
    if (value) setRows((prev) => prev.filter((r) => r.id !== target.id));
    setRemoving(null);
  }

  async function addFailed(index: number) {
    const item = failed[index];
    if (!item || !live) return;
    const value = await run(() =>
      addAttachmentAction(projectId, { type: item.type, url: item.url, title: item.title }),
    );
    if (value) {
      setRows((prev) => [...prev, fromApi(value)]);
      setFailed((prev) => prev.filter((_f, i) => i !== index));
    }
  }

  const full = items.length >= MAX_ATTACHMENTS;
  const editingValues =
    dialog?.editing !== undefined && items[dialog.editing]
      ? {
          type: items[dialog.editing]!.type as AttachmentValues["type"],
          url: items[dialog.editing]!.url,
          title: items[dialog.editing]!.title,
        }
      : undefined;

  return (
    <Paper component="section" aria-label={text.mediaTitle} sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Typography variant="h6" component="h2">
        {text.mediaTitle}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {live ? text.mediaIntro : text.mediaIntroDraft}
      </Typography>

      {failed.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>
            {text.attachmentsFailedTitle.replace("{count}", String(failed.length))}
          </AlertTitle>
          {text.attachmentsFailedHelp}
          <Stack component="ul" sx={{ m: 0, mt: 1, pl: 2 }} spacing={1}>
            {failed.map((f, i) => (
              <li key={`${f.url}-${i}`}>
                <Box component="span" sx={{ overflowWrap: "anywhere" }}>
                  {f.title || f.url}
                </Box>{" "}
                <Button size="small" disabled={busy} onClick={() => void addFailed(i)}>
                  {text.attachmentRetry}
                </Button>
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() => setFailed((prev) => prev.filter((_x, j) => j !== i))}
                >
                  {text.attachmentDismiss}
                </Button>
              </li>
            ))}
          </Stack>
        </Alert>
      )}

      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box aria-live="polite" sx={{ position: "absolute", left: -9999 }}>
        {status}
      </Box>

      {items.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {text.attachmentsEmpty}
        </Typography>
      ) : (
        <List disablePadding sx={{ mb: 2 }}>
          {items.map((row, i) => (
            <ListItem
              key={row.id}
              divider
              disableGutters
              sx={{ gap: 1, flexWrap: "wrap" }}
              secondaryAction={undefined}
            >
              <Chip size="small" variant="outlined" label={typeLabel(row.type)} />
              <ListItemText
                sx={{ minWidth: 0, flex: "1 1 160px" }}
                primary={nameOf(row)}
                secondary={safeHttpsUrl(row.url) ? new URL(row.url).hostname : undefined}
                slotProps={{ primary: { sx: { overflowWrap: "anywhere" } } }}
              />
              <Box sx={{ display: "flex" }}>
                <IconButton
                  aria-label={text.attachmentMoveUp.replace("{name}", nameOf(row))}
                  disabled={busy || i === 0}
                  onClick={() => void move(i, -1)}
                >
                  <ArrowUpward />
                </IconButton>
                <IconButton
                  aria-label={text.attachmentMoveDown.replace("{name}", nameOf(row))}
                  disabled={busy || i === items.length - 1}
                  onClick={() => void move(i, 1)}
                >
                  <ArrowDownward />
                </IconButton>
                <IconButton
                  aria-label={text.attachmentEdit.replace("{name}", nameOf(row))}
                  disabled={busy}
                  onClick={() => setDialog({ editing: i })}
                >
                  <EditOutlined />
                </IconButton>
                <IconButton
                  aria-label={text.attachmentRemove.replace("{name}", nameOf(row))}
                  disabled={busy}
                  onClick={() => setRemoving(i)}
                >
                  <DeleteOutline />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      <Button startIcon={<AddIcon />} disabled={busy || full} onClick={() => setDialog({})}>
        {text.addAttachment}
      </Button>

      {dialog && (
        <AttachmentDialog
          key={dialog.editing ?? "new"}
          open
          editing={editingValues}
          projectId={projectId}
          onSubmit={submitDialog}
          onClose={() => setDialog(null)}
        />
      )}

      <Dialog
        open={removing !== null}
        onClose={() => !busy && setRemoving(null)}
        aria-labelledby="remove-attachment-title"
        aria-describedby="remove-attachment-body"
      >
        <DialogTitle id="remove-attachment-title">
          {text.attachmentRemoveTitle.replace(
            "{name}",
            removing !== null && items[removing] ? nameOf(items[removing]!) : "",
          )}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="remove-attachment-body">
            {text.attachmentRemoveBody}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setRemoving(null)} disabled={busy}>
            {t.projects.form.cancel}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy}
            onClick={() => removing !== null && void remove(removing)}
          >
            {t.projects.form.deleteConfirm}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
