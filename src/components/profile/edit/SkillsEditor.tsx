"use client";

import { FC, FormEvent, ReactNode, useCallback, useState } from "react";
import { Alert, Button, Chip, Link, Stack, TextField, Typography } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { SuggestionsPanel } from "@/components/suggestions/SuggestionsPanel";
import type { SuggestionItem } from "@/lib/api/types";
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

  // The server's list moved under us (a skill accepted from the strip, then the page re-read):
  // take it as the baseline and keep what the student has typed. Skills added meanwhile join the
  // working list, so a later Save cannot drop them.
  const [seen, setSeen] = useState(skills);
  if (seen !== skills && JSON.stringify(seen) !== JSON.stringify(skills)) {
    setSeen(skills);
    const have = new Set(baseline.map((x) => x.toLowerCase()));
    const added = skills.filter((x) => !have.has(x.toLowerCase()));
    setBaseline(skills);
    setList((current) => {
      const there = new Set(current.map((x) => x.toLowerCase()));
      return [...current, ...added.filter((x) => !there.has(x.toLowerCase()))];
    });
  }

  // An accepted `skill.add` is on the profile now: show it before the page has been re-read.
  const accepted = useCallback((item: SuggestionItem) => {
    const name = item.skill;
    if (!name) return;
    const add = (current: string[]) =>
      current.some((x) => x.toLowerCase() === name.toLowerCase()) ? current : [...current, name];
    setBaseline(add);
    setList(add);
  }, []);
  const strip = <SuggestionsPanel groups={["skills"]} variant="strip" onAccepted={accepted} />;

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
        {strip}
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
        {strip}
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
            disabled={busy}
          >
            {t.sectionEdit.cancel}
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
};
