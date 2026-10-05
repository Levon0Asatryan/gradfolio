"use client";

import { FC, ReactNode, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { deleteEntryAction, reorderEntriesAction } from "@/lib/profile/actions";
import type { Section } from "@/lib/profile/sections";
import SectionCard from "../shared/SectionCard";
import { EntryDialog, type EntryValues } from "./EntryDialog";
import { failureText, type Failure } from "./failureText";

export interface EditableItem extends EntryValues {
  id: string;
}

/**
 * One list section in edit mode: add, change, delete and reorder. Every change
 * goes through a server action; the list on screen is the server's, reloaded
 * after each success, so what is shown is what is saved.
 */
export const SectionEditor: FC<{
  section: Section;
  items: EditableItem[];
  empty: string;
  describe: (item: EditableItem) => { primary: ReactNode; secondary?: ReactNode; label: string };
}> = ({ section, items, empty, describe }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const text = t.sectionEdit;
  const [dialog, setDialog] = useState<{ entry: EditableItem | null } | null>(null);
  const [deleting, setDeleting] = useState<EditableItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);

  async function run(action: () => ReturnType<typeof deleteEntryAction>): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setFailure(null);
    try {
      const result = await action();
      if (result.ok) {
        router.refresh();
        return true;
      }
      const f = failureText(t, result.code);
      setFailure(f);
      if (f.reload) router.refresh();
    } catch {
      setFailure(failureText(t, "UNKNOWN"));
    } finally {
      setBusy(false);
    }
    return false;
  }

  const move = (index: number, by: -1 | 1) => {
    const ids = items.map((i) => i.id);
    const [moved] = ids.splice(index, 1);
    if (moved === undefined) return;
    ids.splice(index + by, 0, moved);
    void run(() => reorderEntriesAction(section, ids));
  };

  return (
    <SectionCard
      title={t.profile[section]}
      action={
        <Button size="small" variant="contained" onClick={() => setDialog({ entry: null })}>
          {text.add}
        </Button>
      }
    >
      {failure && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {failure.text}
          {failure.signIn && (
            <>
              {" "}
              <Link href="/auth/login?returnTo=/profile">{t.common.login}</Link>
            </>
          )}
        </Alert>
      )}
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {empty}
        </Typography>
      ) : (
        <List sx={{ py: 0 }}>
          {items.map((item, index) => {
            const d = describe(item);
            return (
              <ListItem key={item.id} divider disableGutters>
                <ListItemText primary={d.primary} secondary={d.secondary} />
                <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                  <IconButton
                    size="small"
                    aria-label={`${text.moveUp}: ${d.label}`}
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`${text.moveDown}: ${d.label}`}
                    disabled={busy || index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <Button
                    size="small"
                    aria-label={`${text.edit}: ${d.label}`}
                    disabled={busy}
                    onClick={() => setDialog({ entry: item })}
                  >
                    {text.edit}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    aria-label={`${text.delete}: ${d.label}`}
                    disabled={busy}
                    onClick={() => setDeleting(item)}
                  >
                    {text.delete}
                  </Button>
                </Stack>
              </ListItem>
            );
          })}
        </List>
      )}

      {dialog && (
        <EntryDialog
          section={section}
          entry={dialog.entry}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            router.refresh();
          }}
          onStale={() => router.refresh()}
        />
      )}

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)}>
        <DialogTitle>{text.confirmDeleteTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{text.confirmDeleteBody}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>{text.cancel}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy}
            onClick={async () => {
              const target = deleting;
              if (!target) return;
              await run(() => deleteEntryAction(section, target.id));
              setDeleting(null);
            }}
          >
            {text.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </SectionCard>
  );
};
