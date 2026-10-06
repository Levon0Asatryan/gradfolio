"use client";

import { FC, FormEvent, ReactNode, useState } from "react";
import { Alert, Button, Chip, Link, Stack, TextField, Typography } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { replaceSkillsAction } from "@/lib/profile/actions";
import { LIMITS, fits } from "@/lib/profile/limits";
import { useUnsavedGuard } from "@/lib/profile/useUnsavedGuard";
import { fieldErrorText } from "../fieldErrorText";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Toast } from "@/components/layout/Toast";
import SectionCard from "../shared/SectionCard";
import { EmptyPrompt } from "./EmptyPrompt";
import { failureText, type Failure } from "./failureText";

/**
 * The skill list in edit mode. Edits are local until Save, which replaces the
 * whole list in one call; until then the page warns before the tab closes and
 * the parent keeps the mode switch locked (`onDirtyChange`).
 */
export const SkillsEditor: FC<{ skills: string[]; icon?: ReactNode }> = ({ skills, icon }) => {
  const { t } = useLanguage();
  const router = useRouter();
  // `baseline` is what the server holds: the prop at first, then what the API kept after a save.
  const [baseline, setBaseline] = useState(skills);
  const [list, setList] = useState(skills);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [tooLong, setTooLong] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // A typed-but-not-added skill is an edit too: leaving would drop it.
  const dirty = JSON.stringify(list) !== JSON.stringify(baseline) || draft.trim() !== "";
  useUnsavedGuard(dirty, t.profileEdit.leavePrompt);

  function add(event: FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    // One skill is a 255-character column on the API's side.
    if (!fits(name, LIMITS.term)) return setTooLong(true);
    setTooLong(false);
    // The API collapses case-insensitive duplicates; do not show one the server will not keep.
    if (!list.some((s) => s.toLowerCase() === name.toLowerCase())) setList([...list, name]);
    setDraft("");
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const result = await replaceSkillsAction(list);
      if (result.ok) {
        // Show the API's canonical list (spelling, dedupe), not the local draft; a refresh keeps client state.
        const kept = result.skills ?? list;
        setBaseline(kept);
        setList(kept);
        setEditing(false);
        setToast(t.sectionEdit.skillsSaved);
        router.refresh();
      } else setFailure(failureText(t, result.code));
    } catch {
      setFailure(failureText(t, "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  const chips = (items: string[], onDelete?: (s: string) => void) => (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {items.map((skill, i) => (
        <Chip
          key={skill}
          label={skill}
          sx={(theme) => ({
            bgcolor: [
              theme.palette.surface.soft,
              theme.palette.category.personal.bg,
              theme.palette.category.hackathon.bg,
            ][i % 3],
            color: [
              theme.palette.primary.main,
              theme.palette.category.personal.fg,
              theme.palette.category.hackathon.fg,
            ][i % 3],
          })}
          onDelete={onDelete ? () => onDelete(skill) : undefined}
          deleteIcon={
            onDelete ? (
              <CancelIcon aria-label={t.sectionEdit.removeSkill.replace("{name}", skill)} />
            ) : undefined
          }
        />
      ))}
    </Stack>
  );

  if (!editing) {
    return (
      <SectionCard
        title={t.profile.skills}
        icon={icon}
        action={
          baseline.length > 0 ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditOutlinedIcon />}
              onClick={() => setEditing(true)}
            >
              {t.profile.editSkills}
            </Button>
          ) : undefined
        }
      >
        {baseline.length === 0 ? (
          <EmptyPrompt
            title={t.profile.emptySkillsTitle}
            hint={t.profile.emptySkillsHint}
            actionLabel={t.profile.editSkills}
            onAction={() => setEditing(true)}
          />
        ) : (
          chips(baseline)
        )}
        <Toast message={toast} onClose={() => setToast(null)} />
      </SectionCard>
    );
  }

  return (
    <SectionCard title={t.profile.skills} icon={icon}>
      <Stack spacing={2}>
        {failure && (
          <Alert severity="error">
            {failure.text}
            {failure.signIn && (
              <>
                {" "}
                <Link href="/auth/login?returnTo=/profile">{t.common.login}</Link>
              </>
            )}
          </Alert>
        )}
        {list.length > 0 && chips(list, (skill) => setList(list.filter((x) => x !== skill)))}
        <Stack component="form" direction="row" spacing={1} onSubmit={add}>
          <TextField
            size="small"
            label={t.profile.newSkill}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setTooLong(false);
            }}
            error={tooLong}
            helperText={tooLong ? fieldErrorText(t, "too_long", LIMITS.term) : undefined}
            fullWidth
          />
          <Button type="submit" variant="outlined">
            {t.sectionEdit.add}
          </Button>
        </Stack>
        {dirty && (
          <Typography variant="body2" color="text.secondary" role="status">
            {t.sectionEdit.skillsUnsaved}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => void save()} disabled={busy || !dirty}>
            {busy ? t.sectionEdit.saving : t.sectionEdit.saveSkills}
          </Button>
          <Button
            onClick={() => {
              setList(baseline);
              setDraft("");
              setEditing(false);
            }}
            disabled={busy || !dirty}
          >
            {t.sectionEdit.cancel}
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
};
