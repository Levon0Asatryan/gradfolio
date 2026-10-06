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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { deleteEntryAction, reorderEntriesAction } from "@/lib/profile/actions";
import type { Section } from "@/lib/profile/sections";
import { Toast } from "@/components/layout/Toast";
import SectionCard from "../shared/SectionCard";
import { EmptyPrompt } from "./EmptyPrompt";
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
  icon?: ReactNode;
  describe: (item: EditableItem) => { primary: ReactNode; secondary?: ReactNode; label: string };
}> = ({ section, items, icon, describe }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const text = t.sectionEdit;
  const addLabel = {
    education: t.profile.addEducation,
    experience: t.profile.addExperience,
    certifications: t.profile.addCertification,
  }[section];
  const empty = {
    education: [t.profile.emptyEducationTitle, t.profile.emptyEducationHint],
    experience: [t.profile.emptyExperienceTitle, t.profile.emptyExperienceHint],
    certifications: [t.profile.emptyCertificationsTitle, t.profile.emptyCertificationsHint],
  }[section];
  const [dialog, setDialog] = useState<{ entry: EditableItem | null } | null>(null);
  const [deleting, setDeleting] = useState<EditableItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function run(
    action: () => ReturnType<typeof deleteEntryAction>,
    done?: string,
  ): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setFailure(null);
    try {
      const result = await action();
      if (result.ok) {
        if (done) setToast(done);
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
    void run(() => reorderEntriesAction(section, ids), text.savedToast);
  };

  const deleteName = deleting ? describe(deleting).label : "";

  return (
    <SectionCard
      title={t.profile[section]}
      icon={icon}
      action={
        items.length > 0 ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setDialog({ entry: null })}
          >
            {addLabel}
          </Button>
        ) : undefined
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
        <EmptyPrompt
          title={empty[0] ?? ""}
          hint={empty[1] ?? ""}
          actionLabel={addLabel}
          onAction={() => setDialog({ entry: null })}
        />
      ) : (
        <List sx={{ py: 0 }}>
          {items.map((item, index) => {
            const d = describe(item);
            return (
              <ListItem key={item.id} divider={index < items.length - 1} disableGutters>
                <ListItemText
                  primary={d.primary}
                  secondary={d.secondary}
                  slotProps={{ primary: { sx: { fontWeight: 800 } } }}
                />
                <Stack direction="row" alignItems="center" flexShrink={0}>
                  {items.length > 1 && (
                    <>
                      <IconButton
                        aria-label={`${text.moveUp}: ${d.label}`}
                        disabled={busy || index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`${text.moveDown}: ${d.label}`}
                        disabled={busy || index === items.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  <IconButton
                    aria-label={`${text.edit}: ${d.label}`}
                    disabled={busy}
                    onClick={() => setDialog({ entry: item })}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    aria-label={`${text.delete}: ${d.label}`}
                    disabled={busy}
                    onClick={() => setDeleting(item)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
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
            setToast(text.savedToast);
            router.refresh();
          }}
          onStale={() => router.refresh()}
        />
      )}

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)}>
        <DialogTitle>{text.confirmDeleteTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {text.confirmDeleteNamed.replace("{name}", deleteName)}
          </DialogContentText>
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
              await run(() => deleteEntryAction(section, target.id), text.deletedToast);
              setDeleting(null);
            }}
          >
            {text.delete}
          </Button>
        </DialogActions>
      </Dialog>
      <Toast message={toast} onClose={() => setToast(null)} />
    </SectionCard>
  );
};
