"use client";

import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Tab,
  Tabs,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Alert,
  Box,
  Stack,
} from "@mui/material";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type {
  SuggestionItem,
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
import {
  acceptSuggestionsAction,
  dismissSuggestionAction,
  loadProfileSuggestionsAction,
} from "@/lib/integrations/suggestionActions";
import { IMPORT_MAX } from "@/lib/integrations/importLimits";
import { errorCode } from "@/lib/integrations/errors";
import { ImportResult } from "./ImportResult";
import { ImportReview, draftProblem, type ReviewRow } from "./ImportReview";
import { type ProfileState, ProfileTab, fieldLabel } from "./ProfileTab";
import { type PickerState, RepoPicker, timeOf } from "./RepoPicker";
import { type Draft, initialDraft, overridesFor } from "./model";

type Step = "pick" | "review" | "result";

const NO_PROFILE: ProfileState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
  refreshError: null,
};

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
export const GithubImportModal: FC<{
  open: boolean;
  onClose: () => void;
  /** Where focus goes when the dialog has closed: the control that opened it. */
  returnFocusTo?: () => HTMLElement | null;
}> = ({ open, onClose, returnFocusTo }) => {
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
  const [tab, setTab] = useState<"repos" | "profile">("repos");
  const [profile, setProfile] = useState<ProfileState>(NO_PROFILE);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [dismissError, setDismissError] = useState<string | null>(null);
  const [profileOutcome, setProfileOutcome] = useState<{ updated: number; failed: number } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<{ code: string; retryAfter?: number } | null>(null);
  const [results, setResults] = useState<GithubImportOutcome[]>([]);
  const [names, setNames] = useState<Record<number, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const saveLock = useRef(false);
  // Same idea for the profile read: an answer for an earlier opening is dropped.
  const profileSequence = useRef(0);
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
    setTab("repos");
    profileSequence.current += 1; // invalidates a profile read still in flight
    setProfile(NO_PROFILE);
    setChecked(new Set());
    setDismissError(null);
    setProfileOutcome(null);
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

  // GitHub's profile data is read when the student first opens its tab (the API throttles its
  // own reads of GitHub), not when the dialog opens: it costs nothing until it is asked for.
  const loadProfile = useCallback(async () => {
    const mine = ++profileSequence.current;
    setProfile((p) => ({ ...p, loading: true, error: null }));
    const result = await loadProfileSuggestionsAction();
    // An answer for an earlier opening of the dialog must not fill (or tick) this one.
    if (mine !== profileSequence.current) return;
    if (!result.ok) {
      setProfile({ ...NO_PROFILE, loaded: true, error: result.code });
      return;
    }
    setProfile({
      items: result.items,
      loading: false,
      loaded: true,
      error: null,
      refreshError: result.refreshError,
    });
    // An empty field is pre-ticked (a fill); one that would replace something is not.
    setChecked(new Set(result.items.filter((i) => i.mode === "fill").map((i) => i.id)));
  }, []);
  useEffect(() => {
    if (open && tab === "profile" && !profile.loaded && !profile.loading) void loadProfile();
  }, [open, tab, profile.loaded, profile.loading, loadProfile]);

  const toggleProfile = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function dismissProfile(id: string) {
    setDismissError(null);
    const result = await dismissSuggestionAction({ id });
    if (!result.ok) {
      setDismissError(message(result));
      return;
    }
    setProfile((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }));
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

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
    // Profile data alone has nothing to preview.
    if (selected.size > 0) void loadPreview([...selected.values()]);
  };

  const chosen = [...selected.values()];
  // Only repositories the preview turned into a draft (and only they have one) can be saved.
  const savable = chosen.filter((r) => drafts[r.repoId]);
  const rows: ReviewRow[] = chosen.map((repo) => ({ repo, preview: previews[repo.repoId] }));
  const profileChosen = profile.items.filter((i) => checked.has(i.id));
  const reposOk =
    chosen.length === 0 ||
    (!previewState.loading &&
      !previewState.error &&
      savable.every((r) => !draftProblem(drafts[r.repoId]!)));
  // Repositories that need no import (already imported, or skipped) do not veto the profile.
  const canSave = reposOk && (savable.length > 0 || profileChosen.length > 0);

  async function save() {
    if (saveLock.current || !canSave) return;
    saveLock.current = true;
    setSaving(true);
    setFailure(null);
    try {
      // Repositories first: if that fails nothing at all has changed, and the profile is untouched.
      if (savable.length > 0) {
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
        // The title as saved (the student may have changed it), else the repository name.
        setNames(
          Object.fromEntries(
            savable.map((r) => [r.repoId, drafts[r.repoId]?.title.trim() || r.fullName]),
          ),
        );
        setResults(result.response.results);
      } else {
        setResults([]);
      }
      // Then the ticked profile fields, one accept each; a failed one is reported, not hidden.
      if (profileChosen.length > 0) {
        const accepted = await acceptSuggestionsAction({ ids: profileChosen.map((i) => i.id) });
        setProfileOutcome(
          accepted.ok
            ? {
                updated: accepted.results.filter((r) => r.ok).length,
                failed: accepted.results.filter((r) => !r.ok).length,
              }
            : { updated: 0, failed: profileChosen.length },
        );
      } else {
        setProfileOutcome(null);
      }
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
      slotProps={{ transition: { onExited: () => returnFocusTo?.()?.focus() } }}
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
          <Tabs
            value={tab}
            onChange={(_, v: "repos" | "profile") => setTab(v)}
            aria-label={text.title}
            sx={{ mb: 2 }}
          >
            <Tab
              value="repos"
              label={text.tabRepos}
              id="import-tab-repos"
              aria-controls="import-panel-repos"
            />
            <Tab
              value="profile"
              label={text.tabProfile}
              id="import-tab-profile"
              aria-controls="import-panel-profile"
            />
          </Tabs>
        )}
        {step === "pick" && tab === "repos" && (
          <div role="tabpanel" id="import-panel-repos" aria-labelledby="import-tab-repos">
            <RepoPicker
              state={picker}
              selected={selected}
              onQuery={onQuery}
              onToggle={toggle}
              onMore={() => picker.nextCursor && void load(picker.query.trim(), picker.nextCursor)}
              onRetry={() => void load(picker.query.trim())}
              errorText={(code) => message({ code, retryAfter: picker.error?.retryAfter })}
            />
          </div>
        )}
        {step === "pick" && tab === "profile" && (
          <div role="tabpanel" id="import-panel-profile" aria-labelledby="import-tab-profile">
            <ProfileTab
              state={profile}
              checked={checked}
              onToggle={toggleProfile}
              onDismiss={(id) => void dismissProfile(id)}
              onRetry={() => void loadProfile()}
              errorText={(code) => message({ code })}
              dismissError={dismissError}
            />
          </div>
        )}
        {step === "review" && chosen.length === 0 && (
          <ProfileSummary items={profileChosen} failure={failure ? message(failure) : null} />
        )}
        {step === "review" && chosen.length > 0 && (
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
        {step === "review" && chosen.length > 0 && profileChosen.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <ProfileSummary items={profileChosen} failure={null} />
          </Box>
        )}
        {step === "result" && (
          <>
            {results.length > 0 && <ImportResult results={results} names={names} />}
            {profileOutcome && (
              <Stack spacing={1} sx={{ mt: results.length > 0 ? 2 : 0 }}>
                {profileOutcome.updated > 0 && (
                  <Alert severity="success">
                    {text.profile.updated.replace("{count}", String(profileOutcome.updated))}
                  </Alert>
                )}
                {profileOutcome.failed > 0 && (
                  <Alert severity="warning" role="alert">
                    {text.profile.failed.replace("{count}", String(profileOutcome.failed))}
                  </Alert>
                )}
              </Stack>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === "pick" && (
          <>
            <Button onClick={onClose}>{text.notNow}</Button>
            <Button
              variant="contained"
              disabled={selected.size === 0 && checked.size === 0}
              onClick={toReview}
            >
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

/** What the ticked profile fields will become, shown once more before Save. */
const ProfileSummary: FC<{ items: SuggestionItem[]; failure: string | null }> = ({
  items,
  failure,
}) => {
  const { t } = useLanguage();
  const text = t.integrations.import.profile;
  return (
    <Stack spacing={1}>
      <Typography component="h3" variant="subtitle1">
        {text.summaryTitle}
      </Typography>
      {failure && (
        <Alert severity="error" role="alert">
          {failure}
        </Alert>
      )}
      {items.map((i) => (
        <Typography key={i.id} variant="body2" sx={{ overflowWrap: "anywhere" }}>
          <strong>{fieldLabel(i, text.fields)}:</strong> {i.proposed ?? text.emptyNow}
        </Typography>
      ))}
    </Stack>
  );
};
