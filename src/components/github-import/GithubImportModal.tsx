"use client";

import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type {
  GithubDraft,
  GithubImportOutcome,
  GithubPreviewOutcome,
  GithubRepo,
} from "@/lib/api/types";
import {
  importGithubReposAction,
  listGithubReposAction,
  previewGithubImportAction,
} from "@/lib/integrations/importActions";
import { IMPORT_MAX } from "@/lib/integrations/importLimits";
import { errorCode } from "@/lib/integrations/errors";
import { ImportResult } from "./ImportResult";
import { ImportReview, draftProblem, type ReviewRow } from "./ImportReview";
import { type PickerState, RepoPicker, timeOf } from "./RepoPicker";
import { type Draft, initialDraft, overridesFor } from "./model";

type Step = "pick" | "review" | "result";

const EMPTY: PickerState = {
  repos: [],
  nextCursor: null,
  loading: true,
  loadingMore: false,
  error: null,
  rateLimit: null,
  query: "",
};

/**
 * The one GitHub import dialog: pick repositories, review the drafts, save, see the result.
 * Opened from the integrations page, from Projects, and right after connecting. It is a MUI
 * `Dialog`: focus is trapped inside, Escape closes it, and focus returns to what opened it.
 *
 * Nothing is imported or changed until Save; "Not now" closes it and leaves everything as it
 * was. Every call is a server action (Q11).
 */
export const GithubImportModal: FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { t, language } = useLanguage();
  const router = useRouter();
  const text = t.integrations.import;

  const [step, setStep] = useState<Step>("pick");
  const [picker, setPicker] = useState<PickerState>(EMPTY);
  const [selected, setSelected] = useState<Map<number, GithubRepo>>(new Map());
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [previews, setPreviews] = useState<Record<number, GithubPreviewOutcome>>({});
  const [previewState, setPreviewState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<{ code: string; retryAfter?: number } | null>(null);
  const [results, setResults] = useState<GithubImportOutcome[]>([]);
  const [names, setNames] = useState<Record<number, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const saveLock = useRef(false);
  // A newer search must win over a slower older one.
  const sequence = useRef(0);

  const message = useCallback(
    (f: { code: string; retryAfter?: number }) => {
      const base = t.integrations.errors[errorCode(f.code)];
      const resets =
        f.code === "GITHUB_RATE_LIMITED" ? timeOf(picker.rateLimit?.resetsAt, language) : "";
      if (f.retryAfter !== undefined) {
        return `${base} ${t.integrations.retryIn.replace("{seconds}", String(f.retryAfter))}`;
      }
      return resets ? `${base} ${text.rateLimited.replace("{time}", resets)}` : base;
    },
    [t, picker.rateLimit, language, text],
  );

  const load = useCallback(async (query: string, cursor?: string) => {
    const mine = ++sequence.current;
    setPicker((p) =>
      cursor
        ? { ...p, loadingMore: true, error: null }
        : { ...p, query, loading: true, error: null, repos: [], nextCursor: null },
    );
    const result = await listGithubReposAction({ q: query || undefined, cursor });
    if (mine !== sequence.current) return;
    if (!result.ok) {
      setPicker((p) => ({
        ...p,
        loading: false,
        loadingMore: false,
        error: { code: result.code, retryAfter: result.retryAfter },
      }));
      return;
    }
    setPicker((p) => ({
      ...p,
      loading: false,
      loadingMore: false,
      error: null,
      repos: cursor ? [...p.repos, ...result.page.items] : result.page.items,
      nextCursor: result.page.nextCursor,
      rateLimit: result.page.rateLimit,
    }));
  }, []);

  // Open: start clean and load the first page. Closing keeps nothing (a new open is a new import).
  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setSelected(new Map());
    setDrafts({});
    setFailure(null);
    setResults([]);
    setPreviews({});
    setPreviewState({ loading: false, error: null });
    setPicker(EMPTY);
    void load("");
    // `load` is stable.
  }, [open, load]);

  // A search types a letter at a time: wait for a pause.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onQuery = (q: string) => {
    setPicker((p) => ({ ...p, query: q }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void load(q.trim()), 300);
  };

  // The step changed: the heading is where a screen reader should land.
  useEffect(() => {
    if (open) heading.current?.focus();
  }, [step, open]);

  const toggle = (repo: GithubRepo) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(repo.repoId)) next.delete(repo.repoId);
      else if (next.size < IMPORT_MAX) next.set(repo.repoId, repo);
      return next;
    });
  };

  // The drafts as the API would create them (README read and sanitized there). Re-run whenever
  // the review step is entered, so a changed selection is always previewed.
  const loadPreview = useCallback(
    async (repos: GithubRepo[]) => {
      if (repos.length === 0) return;
      setPreviewState({ loading: true, error: null });
      const result = await previewGithubImportAction({ repoIds: repos.map((r) => r.repoId) });
      if (!result.ok) {
        setPreviewState({ loading: false, error: message(result) });
        return;
      }
      const byId: Record<number, GithubPreviewOutcome> = {};
      for (const r of result.response.results) byId[r.repoId] = r;
      setPreviews(byId);
      setDrafts((prev) => {
        const next: Record<number, Draft> = {};
        for (const r of result.response.results) {
          // A draft the student already edited is kept when they come back to this step.
          if (r.outcome === "draft" && r.draft)
            next[r.repoId] = prev[r.repoId] ?? initialDraft(r.draft);
        }
        return next;
      });
      setPreviewState({ loading: false, error: null });
    },
    [message],
  );

  const toReview = () => {
    setFailure(null);
    setStep("review");
    void loadPreview([...selected.values()]);
  };

  const chosen = [...selected.values()];
  // Only repositories the preview turned into a draft (and only they have one) can be saved.
  const savable = chosen.filter((r) => drafts[r.repoId]);
  const rows: ReviewRow[] = chosen.map((repo) => ({ repo, preview: previews[repo.repoId] }));
  const canSave =
    !previewState.loading &&
    !previewState.error &&
    savable.length > 0 &&
    savable.every((r) => !draftProblem(drafts[r.repoId]!));

  async function save() {
    if (saveLock.current || !canSave) return;
    saveLock.current = true;
    setSaving(true);
    setFailure(null);
    try {
      const result = await importGithubReposAction({
        repoIds: savable.map((r) => r.repoId),
        overrides: overridesFor(
          Object.fromEntries(
            savable.map((r) => [r.repoId, previews[r.repoId]!.draft as GithubDraft]),
          ),
          drafts,
        ),
      });
      if (!result.ok) {
        setFailure({ code: result.code, retryAfter: result.retryAfter });
        return;
      }
      setNames(Object.fromEntries(savable.map((r) => [r.repoId, r.fullName])));
      setResults(result.response.results);
      setStep("result");
      router.refresh();
    } catch {
      setFailure({ code: "UNKNOWN" });
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  const title =
    step === "pick" ? text.title : step === "review" ? text.reviewTitle : text.resultTitle;

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="github-import-title"
    >
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Typography
          id="github-import-title"
          component="h2"
          variant="h6"
          tabIndex={-1}
          ref={heading}
        >
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {step === "pick" && (
          <RepoPicker
            state={picker}
            selected={selected}
            onQuery={onQuery}
            onToggle={toggle}
            onMore={() => picker.nextCursor && void load(picker.query.trim(), picker.nextCursor)}
            onRetry={() => void load(picker.query.trim())}
            errorText={(code) => message({ code, retryAfter: picker.error?.retryAfter })}
          />
        )}
        {step === "review" && (
          <ImportReview
            rows={rows}
            loading={previewState.loading}
            loadError={previewState.error}
            onRetry={() => void loadPreview(chosen)}
            drafts={drafts}
            onChange={(id, patch) => setDrafts((d) => ({ ...d, [id]: { ...d[id]!, ...patch } }))}
            onRemove={(repo) =>
              setSelected((prev) => {
                const next = new Map(prev);
                next.delete(repo.repoId);
                return next;
              })
            }
            failure={failure ? message(failure) : null}
          />
        )}
        {step === "result" && <ImportResult results={results} names={names} />}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === "pick" && (
          <>
            <Button onClick={onClose}>{text.notNow}</Button>
            <Button variant="contained" disabled={selected.size === 0} onClick={toReview}>
              {text.continue}
            </Button>
          </>
        )}
        {step === "review" && (
          <>
            <Button onClick={() => setStep("pick")} disabled={saving}>
              {text.back}
            </Button>
            <Button variant="contained" disabled={!canSave || saving} onClick={() => void save()}>
              {saving ? text.saving : text.save}
            </Button>
          </>
        )}
        {step === "result" && (
          <>
            <Button component={Link} href="/projects">
              {text.goToProjects}
            </Button>
            <Button variant="contained" onClick={onClose}>
              {text.close}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
