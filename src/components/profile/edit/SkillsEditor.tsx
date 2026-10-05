"use client";

import { FC, FormEvent, useEffect, useState } from "react";
import { Alert, Button, Chip, Link, Stack, TextField, Typography } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { replaceSkillsAction } from "@/lib/profile/actions";
import SectionCard from "../shared/SectionCard";
import { failureText, type Failure } from "./failureText";

/**
 * The skill list in edit mode. Edits are local until Save, which replaces the
 * whole list in one call; until then the page warns before the tab closes and
 * the parent keeps the mode switch locked (`onDirtyChange`).
 */
export const SkillsEditor: FC<{
  skills: string[];
  onDirtyChange: (dirty: boolean) => void;
}> = ({ skills, onDirtyChange }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const [list, setList] = useState(skills);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(list) !== JSON.stringify(skills);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function add(event: FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    setSaved(false);
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
        setSaved(true);
        router.refresh();
      } else setFailure(failureText(t, result.code));
    } catch {
      setFailure(failureText(t, "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title={t.profile.skills}>
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
        {saved && !dirty && (
          <Alert severity="success" role="status">
            {t.sectionEdit.skillsSaved}
          </Alert>
        )}
        {list.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t.profile.noSkills}
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {list.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                onDelete={() => {
                  setSaved(false);
                  setList(list.filter((s) => s !== skill));
                }}
                deleteIcon={
                  <CancelIcon aria-label={t.sectionEdit.removeSkill.replace("{name}", skill)} />
                }
              />
            ))}
          </Stack>
        )}
        <Stack component="form" direction="row" spacing={1} onSubmit={add}>
          <TextField
            size="small"
            label={t.profile.newSkill}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
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
          <Button onClick={() => setList(skills)} disabled={busy || !dirty}>
            {t.sectionEdit.cancel}
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
};
