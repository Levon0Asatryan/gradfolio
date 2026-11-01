"use client";

import Link from "next/link";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Link as MuiLink,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { LinkedinImportResult, LinkedinPreview } from "@/lib/api/types";
import {
  confirmLinkedinAction,
  previewLinkedinAction,
  startLinkedinUploadAction,
} from "@/lib/linkedin/actions";
import { linkedinErrorCode, type LinkedinErrorCode } from "@/lib/linkedin/errors";
import { LINKEDIN_ZIP_MAX_BYTES } from "@/lib/linkedin/limits";
import {
  buildConfirm,
  defaultSelection,
  rowsFromPreview,
  type ReviewModel,
} from "@/lib/linkedin/model";
import { GUIDE_SHOTS } from "@/lib/linkedin/screenshots";
import { putFile } from "@/lib/uploads/putFile";
import { useUnsavedGuard } from "@/lib/profile/useUnsavedGuard";
import { LinkedinReview } from "./LinkedinReview";

const DOWNLOAD_PAGE = "https://www.linkedin.com/mypreferences/d/download-my-data";
type Step = "guide" | "upload" | "review" | "done";
type Busy = "uploading" | "reading" | "confirming" | null;
type Problem = { code: LinkedinErrorCode; retryAfter?: number };

const STEPS: Step[] = ["guide", "upload", "review", "done"];

const sizeText = (bytes: number) =>
  bytes < 1_000_000
    ? `${Math.max(1, Math.round(bytes / 1000))} KB`
    : `${(bytes / 1_000_000).toFixed(1)} MB`;

/**
 * Import from the member's own LinkedIn data export, in four steps: how to get the ZIP, upload
 * it (straight to storage, with progress), pick what to keep, done. The ZIP is read by the API,
 * never here; the browser holds only the proposal, and nothing is kept in browser storage or the
 * URL. Nothing reaches the profile until "Add selected", and only what is ticked and valid.
 */
export const LinkedinImportModal: FC<{
  open: boolean;
  onClose: () => void;
  /** The profile changed: the page behind should reload its data. */
  onImported: () => void;
}> = ({ open, onClose, onImported }) => {
  const { t, language } = useLanguage();
  const text = t.linkedinImport;

  const [step, setStep] = useState<Step>("guide");
  const [busy, setBusy] = useState<Busy>(null);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileProblem, setFileProblem] = useState<"tooBig" | "notZip" | "empty" | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [preview, setPreview] = useState<LinkedinPreview | null>(null);
  const [model, setModel] = useState<ReviewModel>({ entries: [], skills: [] });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [result, setResult] = useState<LinkedinImportResult | null>(null);

  const abort = useRef<AbortController | null>(null);
  const sending = useRef(false);
  // Bumped by every reset: an answer that arrives for an earlier run is dropped, not applied.
  const run = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);

  // Leaving with a proposal on screen or a request in flight is asked about, not silent.
  const working = busy !== null;
  const dirty = open && (working || step === "review");
  useUnsavedGuard(dirty, t.profileEdit.leavePrompt);

  // Each step announces itself: focus moves to its heading.
  // On first open the dialog's portal mounts a tick later and its focus trap takes focus first,
  // so the move waits for both.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => heading.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open, step]);

  const reset = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    sending.current = false;
    run.current += 1;
    setStep("guide");
    setBusy(null);
    setProgress(0);
    setFile(null);
    setFileProblem(null);
    setProblem(null);
    setPreview(null);
    setModel({ entries: [], skills: [] });
    setSelected(new Set());
    setResult(null);
  }, []);

  // A closed dialog keeps nothing: not the file, not the proposal.
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const fail = (code: string, retryAfter?: number) =>
    setProblem({ code: linkedinErrorCode(code), ...(retryAfter ? { retryAfter } : {}) });

  function choose(next: File | undefined) {
    setProblem(null);
    if (!next) return;
    if (next.size === 0) setFileProblem("empty");
    else if (next.size > LINKEDIN_ZIP_MAX_BYTES) setFileProblem("tooBig");
    else if (!/\.zip$/i.test(next.name)) setFileProblem("notZip");
    else setFileProblem(null);
    setFile(next);
  }

  async function send() {
    if (!file || fileProblem || sending.current) return;
    sending.current = true;
    const gen = run.current;
    setProblem(null);
    const controller = new AbortController();
    abort.current = controller;
    try {
      setBusy("uploading");
      setProgress(0);
      const ticket = await startLinkedinUploadAction({ size: file.size });
      if (gen !== run.current) return;
      if (!ticket.ok) return fail(ticket.code, ticket.retryAfter);
      const put = await putFile({
        url: ticket.uploadUrl,
        headers: ticket.headers,
        file,
        onProgress: setProgress,
        signal: controller.signal,
      });
      if (gen !== run.current) return;
      if (!put.ok) {
        if (put.reason === "aborted") return;
        return fail(put.reason === "rejected" ? "UPLOAD_REJECTED" : "UPLOAD_UNREACHABLE");
      }
      setBusy("reading");
      const read = await previewLinkedinAction({ uploadId: ticket.uploadId });
      if (gen !== run.current) return;
      if (!read.ok) return fail(read.code, read.retryAfter);
      const rows = rowsFromPreview(read.preview);
      setPreview(read.preview);
      setModel(rows);
      setSelected(defaultSelection(rows));
      setFile(null);
      setStep("review");
    } catch {
      if (gen === run.current) fail("UNKNOWN");
    } finally {
      if (gen === run.current) {
        sending.current = false;
        abort.current = null;
        setBusy(null);
      }
    }
  }

  async function confirm() {
    if (sending.current) return;
    const body = buildConfirm(model, selected);
    if (!body) return;
    sending.current = true;
    const gen = run.current;
    setProblem(null);
    setBusy("confirming");
    try {
      const done = await confirmLinkedinAction(body);
      if (gen !== run.current) return;
      if (!done.ok) return fail(done.code, done.retryAfter);
      setResult(done.result);
      setStep("done");
    } catch {
      if (gen === run.current) fail("UNKNOWN");
    } finally {
      if (gen === run.current) {
        sending.current = false;
        setBusy(null);
      }
    }
  }

  const toggle = (ids: string[], on: boolean) =>
    setSelected((cur) => {
      const next = new Set(cur);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const edit = (id: string, values: Record<string, string>) =>
    setModel((cur) => ({
      ...cur,
      entries: cur.entries.map((r) => (r.id === id ? { ...r, values } : r)),
    }));

  const body = buildConfirm(model, selected);
  const total = model.entries.length + model.skills.length;
  const selectedCount =
    (body?.experience.length ?? 0) +
    (body?.education.length ?? 0) +
    (body?.certifications.length ?? 0) +
    (body?.skills.length ?? 0);
  const nothingNew =
    step === "review" &&
    model.entries.every((r) => r.status === "duplicate") &&
    model.skills.every((s) => s.status === "duplicate");

  function requestClose() {
    if (busy === "confirming") return;
    if (step === "review" && !window.confirm(t.profileEdit.leavePrompt)) return;
    if (step === "done") onImported();
    onClose();
  }

  const stepIndex = STEPS.indexOf(step);
  const shots = GUIDE_SHOTS[language];

  return (
    <Dialog
      open={open}
      onClose={requestClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="linkedin-import-title"
    >
      <DialogTitle id="linkedin-import-title" component="div">
        <Typography variant="overline" color="text.secondary" component="p">
          {text.stepOf
            .replace("{n}", String(stepIndex + 1))
            .replace("{total}", String(STEPS.length))}
          {" · "}
          {text.stepNames[stepIndex]}
        </Typography>
        <Typography ref={heading} tabIndex={-1} component="h2" variant="h5">
          {step === "guide"
            ? text.guide.heading
            : step === "upload"
              ? text.upload.heading
              : step === "review"
                ? text.review.heading
                : text.done.heading}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {problem && (
          <Alert severity="error" role="alert" sx={{ mb: 2 }}>
            {text.errors[problem.code]}
            {problem.retryAfter
              ? ` ${text.retryIn.replace("{seconds}", String(problem.retryAfter))}`
              : ""}
          </Alert>
        )}

        {step === "guide" && (
          <Stack spacing={2}>
            <Typography>{text.guide.intro}</Typography>
            <Box component="ol" sx={{ m: 0, pl: 3, display: "grid", gap: 1 }}>
              {text.guide.steps.map((s) => (
                <li key={s}>
                  <Typography>{s}</Typography>
                </li>
              ))}
            </Box>
            <Typography sx={{ fontWeight: 600 }}>{text.guide.notUnzip}</Typography>
            <MuiLink href={DOWNLOAD_PAGE} target="_blank" rel="noopener noreferrer">
              {text.guide.openLinkedin}
            </MuiLink>
            <Typography variant="body2" color="text.secondary">
              {text.guide.privacy}
            </Typography>
            {shots.length > 0 && (
              <Stack spacing={1} component="section" aria-label={text.guide.shotsTitle}>
                {shots.map((shot) => (
                  <Box
                    key={shot.src}
                    component="img"
                    src={shot.src}
                    alt={shot.alt}
                    loading="lazy"
                    sx={{
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {step === "upload" && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {text.upload.hint}
            </Typography>
            <Box>
              <Button
                component="label"
                variant="outlined"
                disabled={working}
                sx={{ textTransform: "none" }}
              >
                {file ? text.upload.chooseAnother : text.upload.choose}
                <input
                  type="file"
                  hidden
                  accept=".zip,application/zip"
                  onChange={(e) => {
                    choose(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </Button>
            </Box>
            {file && (
              <Typography sx={{ overflowWrap: "anywhere" }}>
                {text.upload.chosen
                  .replace("{name}", file.name)
                  .replace("{size}", sizeText(file.size))}
              </Typography>
            )}
            {fileProblem && (
              <Alert severity="error" role="alert">
                {text.upload[fileProblem]}
              </Alert>
            )}
            {working && (
              <Box role="status">
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {busy === "uploading"
                    ? text.upload.uploading.replace("{percent}", String(Math.round(progress * 100)))
                    : text.upload.reading}
                </Typography>
                <LinearProgress
                  variant={busy === "uploading" ? "determinate" : "indeterminate"}
                  value={Math.round(progress * 100)}
                  aria-label={
                    busy === "uploading"
                      ? text.upload.uploading.replace("{percent}", "")
                      : text.upload.reading
                  }
                />
              </Box>
            )}
          </Stack>
        )}

        {step === "review" && preview && (
          <Stack spacing={2}>
            {nothingNew && <Alert severity="info">{text.review.nothingNew}</Alert>}
            <LinkedinReview
              model={model}
              selected={selected}
              onToggle={toggle}
              onEdit={edit}
              preview={preview}
              disabled={busy === "confirming"}
            />
          </Stack>
        )}

        {step === "done" && result && (
          <Stack spacing={2}>
            <Typography variant="subtitle2" component="h3">
              {text.done.added}
            </Typography>
            <CountList counts={result.added} />
            <Typography variant="subtitle2" component="h3">
              {text.done.skipped}
            </Typography>
            <CountList counts={result.skipped} />
            <MuiLink component={Link} href="/profile" onClick={onImported}>
              {text.done.viewProfile}
            </MuiLink>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, py: 2 }}>
        {step === "guide" && (
          <>
            <Button onClick={requestClose}>{text.cancel}</Button>
            <Button variant="contained" onClick={() => setStep("upload")}>
              {text.next}
            </Button>
          </>
        )}
        {step === "upload" && (
          <>
            {working ? (
              <Button onClick={() => abort.current?.abort()} disabled={busy !== "uploading"}>
                {text.upload.cancelUpload}
              </Button>
            ) : (
              <Button onClick={() => setStep("guide")}>{text.back}</Button>
            )}
            <Button
              variant="contained"
              onClick={send}
              disabled={!file || fileProblem !== null || working}
            >
              {text.upload.send}
            </Button>
          </>
        )}
        {step === "review" && (
          <>
            <Typography variant="body2" role="status" sx={{ mr: "auto", minWidth: 0 }}>
              {selectedCount === 0
                ? text.review.nothingSelected
                : text.review.selectedCount
                    .replace("{count}", String(selectedCount))
                    .replace("{total}", String(total))}
            </Typography>
            <Button
              onClick={() => {
                if (window.confirm(t.profileEdit.leavePrompt)) reset();
              }}
              disabled={working}
            >
              {text.startOver}
            </Button>
            <Button variant="contained" onClick={confirm} disabled={working || selectedCount === 0}>
              {busy === "confirming" ? text.review.adding : text.review.add}
            </Button>
          </>
        )}
        {step === "done" && (
          <Button variant="contained" onClick={requestClose}>
            {text.close}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const CountList: FC<{ counts: LinkedinImportResult["added"] }> = ({ counts }) => {
  const { t } = useLanguage();
  const names = t.linkedinImport.review.sections;
  const entries = (["experience", "education", "certifications", "skills"] as const).map(
    (k) => [k, counts[k]] as const,
  );
  return (
    <List dense disablePadding>
      {entries.map(([key, n]) => (
        <ListItem key={key} disableGutters sx={{ justifyContent: "space-between" }}>
          <span>{names[key]}</span>
          <span>{t.linkedinImport.done.countLine.replace("{count}", String(n))}</span>
        </ListItem>
      ))}
    </List>
  );
};
