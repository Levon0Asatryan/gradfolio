"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Profile, ResumeRequest } from "@/lib/api/types";
import { RESUME_MAX_PROJECTS, RESUME_SECTIONS } from "@/lib/resume/request";

export function ResumeDownload({ profile }: { profile: Profile }) {
  const { t, language } = useLanguage();
  const copy = t.resume;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sections, setSections] = useState<Set<(typeof RESUME_SECTIONS)[number]>>(
    new Set(RESUME_SECTIONS.filter((s) => s !== "contact")),
  );
  const candidates = profile.projects.filter(
    (p) => p.role === "owner" || (p.isPublic && !p.isDraft),
  );
  const [projectIds, setProjectIds] = useState<string[]>(
    candidates
      .filter((p) => p.isPublic && !p.isDraft)
      .slice(0, RESUME_MAX_PROJECTS)
      .map((p) => p.id),
  );
  const [includePrivate, setIncludePrivate] = useState(false);
  const hasPrivate = candidates.some((p) => !p.isPublic || p.isDraft);

  async function download() {
    setBusy(true);
    setError("");
    try {
      const body: ResumeRequest = {
        sections: [...sections],
        language,
        projectIds,
        includePrivateProjects: includePrivate,
      };
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? copy.rateLimited
            : response.status === 422
              ? copy.tooLarge
              : response.status === 404
                ? copy.projectUnavailable
                : copy.failed,
        );
        return;
      }
      if (!response.headers.get("content-type")?.startsWith("application/pdf")) {
        setError(copy.failed);
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "gradfolio-resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch {
      setError(copy.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        startIcon={<DownloadOutlinedIcon />}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        {copy.download}
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        aria-labelledby="resume-title"
      >
        <DialogTitle id="resume-title">{copy.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography color="text.secondary">{copy.intro}</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <FormGroup>
              {RESUME_SECTIONS.map((section) => (
                <FormControlLabel
                  key={section}
                  label={copy.sections[section]}
                  control={
                    <Checkbox
                      checked={sections.has(section)}
                      disabled={busy}
                      onChange={(_, checked) =>
                        setSections((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(section);
                          else next.delete(section);
                          return next;
                        })
                      }
                    />
                  }
                />
              ))}
            </FormGroup>
            {sections.has("projects") && (
              <>
                {hasPrivate && (
                  <FormControlLabel
                    label={copy.includePrivate}
                    control={
                      <Checkbox
                        checked={includePrivate}
                        disabled={busy}
                        onChange={(_, checked) => {
                          setIncludePrivate(checked);
                          if (!checked)
                            setProjectIds((ids) =>
                              ids.filter((id) =>
                                candidates.some((p) => p.id === id && p.isPublic && !p.isDraft),
                              ),
                            );
                        }}
                      />
                    }
                  />
                )}
                {includePrivate && <Alert severity="warning">{copy.privateWarning}</Alert>}
                <Typography color="text.secondary">
                  {copy.projectLimit.replace("{max}", String(RESUME_MAX_PROJECTS))}
                </Typography>
                <FormGroup>
                  {candidates.map((p) => (
                    <FormControlLabel
                      key={p.id}
                      label={p.title}
                      control={
                        <Checkbox
                          checked={projectIds.includes(p.id)}
                          disabled={
                            busy ||
                            ((!p.isPublic || p.isDraft) && !includePrivate) ||
                            (!projectIds.includes(p.id) && projectIds.length >= RESUME_MAX_PROJECTS)
                          }
                          onChange={(_, checked) =>
                            setProjectIds((ids) =>
                              checked
                                ? [...ids, p.id].slice(0, RESUME_MAX_PROJECTS)
                                : ids.filter((id) => id !== p.id),
                            )
                          }
                        />
                      }
                    />
                  ))}
                </FormGroup>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            {copy.cancel}
          </Button>
          <Button
            variant="contained"
            onClick={() => void download()}
            disabled={
              busy ||
              sections.size === 0 ||
              (sections.size === 1 && sections.has("projects") && projectIds.length === 0)
            }
          >
            {busy ? copy.generating : copy.download}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
