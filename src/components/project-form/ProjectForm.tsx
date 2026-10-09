"use client";

import { FC, FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PROJECT_CATEGORIES } from "@/components/theme/tokens";
import type { FieldErrors } from "@/lib/profile/headerPatch";
import { measure, type Limit } from "@/lib/profile/limits";
import { useUnsavedGuard } from "@/lib/profile/useUnsavedGuard";
import { createProjectAction, updateProjectAction } from "@/lib/projects/actions";
import {
  EMPTY_PROJECT,
  STATUSES,
  isEmptyDescription,
  parseProjectForm,
  type ProjectFormValues,
} from "@/lib/projects/form";
import { PROJECT_LIMITS } from "@/lib/projects/limits";
import type { ProjectAttachment } from "@/lib/api/types";
import type { AttachmentValues } from "@/lib/projects/attachments";
import { UploadControl } from "@/components/uploads/UploadControl";
import { signUploadAction } from "@/lib/uploads/actions";
import { counterText } from "@/components/profile/fieldErrorText";
import { AttachmentsEditor, failedKey } from "./AttachmentsEditor";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { RichTextEditorLazy } from "./RichTextEditorLazy";
import { TermsInput } from "./TermsInput";
import { projectFieldError } from "./errorText";

export interface ProjectFormProps {
  mode: "create" | "edit";
  /** Edit only: the project's id and its stored values. */
  projectId?: string;
  initial?: ProjectFormValues;
  /** Edit only: the stored attachments, which are saved by their own requests. */
  attachments?: ProjectAttachment[];
}

/** What the form shows for a failed save: the API's code is the contract. */
function failureKey(code: string) {
  switch (code) {
    case "UNAUTHENTICATED":
      return "errorSignInAgain";
    case "VALIDATION_FAILED":
      return "errorValidation";
    case "LIMIT_REACHED":
      return "errorLimit";
    case "NOT_FOUND":
      return "errorNotFound";
    case "RATE_LIMITED":
      return "errorRateLimited";
    default:
      return "errorSave";
  }
}

/**
 * Create or edit a project: one page, section cards, one Save. Saves through a
 * server action (the token stays on the server) and leaves only after the API
 * said yes; a failed save keeps every typed value. The UI is not the guard: the
 * actions take no user id and the API answers 404 to a non-owner.
 */
export const ProjectForm: FC<ProjectFormProps> = ({
  mode,
  projectId,
  initial = EMPTY_PROJECT,
  attachments = [],
}) => {
  const { t } = useLanguage();
  const text = t.projects.form;
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormValues>(initial);
  const [draftAttachments, setDraftAttachments] = useState<AttachmentValues[]>([]);
  const [baseline, setBaseline] = useState(JSON.stringify([initial, []]));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const descLabelId = useId();
  const descErrorId = useId();

  const dirty = !leaving && JSON.stringify([values, draftAttachments]) !== baseline;
  useUnsavedGuard(dirty, t.profileEdit.leavePrompt);

  const errorCount = Object.keys(errors).length;
  useEffect(() => {
    if (errorCount > 0 || failure) summaryRef.current?.focus();
  }, [errorCount, failure]);

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const err = (key: string, limit?: Limit) => {
    const e = errors[key];
    return e ? projectFieldError(t, key, e, limit) : undefined;
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setFailure(null);
    const checked = parseProjectForm(values);
    if (!checked.ok) {
      setErrors(checked.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const result =
        mode === "create"
          ? await createProjectAction(values, draftAttachments)
          : await updateProjectAction(projectId, values);
      if (result.ok) {
        // Nothing is lost past this point: stop warning about unsaved changes, then go.
        setBaseline(JSON.stringify([values, draftAttachments]));
        setLeaving(true);
        if (result.failedAttachments?.length) {
          // The project is saved but some attachments are not: hand their values to the edit page.
          try {
            sessionStorage.setItem(failedKey(result.id), JSON.stringify(result.failedAttachments));
          } catch {
            // Blocked storage: the project exists, the user adds them again.
          }
          router.push(`/projects/${result.id}/edit?flash=created`);
          return;
        }
        router.push(`/projects/${result.id}?flash=${mode === "create" ? "created" : "saved"}`);
        return;
      }
      if (result.fields) setErrors(result.fields);
      setFailure(failureKey(result.code));
    } catch {
      setFailure("errorSave");
    } finally {
      setSaving(false);
    }
  }

  const text_ = (
    key: "title" | "summary" | "course" | "professor" | "liveDemoUrl" | "repoUrl" | "heroImageUrl",
    label: string,
    extra: Record<string, unknown> = {},
  ) => {
    const limit = PROJECT_LIMITS[key];
    return (
      <TextField
        label={label}
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        error={Boolean(errors[key])}
        helperText={
          err(key, limit) ??
          (key === "summary"
            ? `${text.summaryHelp} ${counterText(t, measure(values.summary, limit), limit)}`
            : undefined) ??
          (key === "heroImageUrl" ? text.heroImageHelp : undefined)
        }
        required={key === "title"}
        size="small"
        fullWidth
        {...extra}
      />
    );
  };

  const errorList = Object.entries(errors);
  const section = (title: string, children: React.ReactNode) => (
    <Paper component="section" aria-label={title} sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Stack spacing={2}>{children}</Stack>
    </Paper>
  );

  return (
    <PageContainer maxWidth={800}>
      <PageHeader title={mode === "create" ? text.newTitle : text.editTitle} />
      <Box
        component="form"
        onSubmit={submit}
        noValidate
        aria-label={mode === "create" ? text.newTitle : text.editTitle}
      >
        <Stack spacing={3}>
          <div ref={summaryRef} tabIndex={-1}>
            {failure && (
              <Alert severity="error" role="alert" sx={{ mb: errorList.length ? 1 : 0 }}>
                {text[failure as keyof typeof text]}
                {failure === "errorSignInAgain" && (
                  <>
                    {" "}
                    <Link
                      href={`/auth/login?returnTo=${encodeURIComponent(mode === "edit" ? `/projects/${projectId}/edit` : "/projects/new")}`}
                    >
                      {t.common.login}
                    </Link>
                  </>
                )}
              </Alert>
            )}
            {errorList.length > 0 && (
              <Alert severity="error" role="alert">
                {text.errorSummaryTitle.replace("{count}", String(errorList.length))}
                <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                  {errorList.map(([key, e]) => (
                    <li key={key}>
                      {projectFieldError(
                        t,
                        key,
                        e as never,
                        PROJECT_LIMITS[key as keyof typeof PROJECT_LIMITS] as Limit | undefined,
                      )}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
          </div>

          {section(
            text.sectionBasics,
            <>
              {text_("title", text.title, { autoFocus: mode === "create" })}
              {text_("summary", text.summary, { multiline: true, minRows: 3 })}
              <FormControl>
                <FormLabel id="cat-label">{text.category}</FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="cat-label"
                  value={values.category}
                  onChange={(e) => set("category", e.target.value as ProjectFormValues["category"])}
                >
                  {PROJECT_CATEGORIES.map((c) => (
                    <FormControlLabel
                      key={c}
                      value={c}
                      control={<Radio />}
                      label={t.projects.categories[c]}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
              <TextField
                select
                size="small"
                label={text.status}
                value={values.status}
                onChange={(e) => set("status", e.target.value as ProjectFormValues["status"])}
              >
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s === "ongoing"
                      ? text.statusOngoing
                      : s === "completed"
                        ? text.statusCompleted
                        : text.statusArchived}
                  </MenuItem>
                ))}
              </TextField>
            </>,
          )}

          {section(
            text.sectionDescription,
            <Box>
              <Typography
                id={descLabelId}
                component="label"
                variant="body2"
                sx={{ display: "block", mb: 1, fontWeight: 700 }}
              >
                {text.descriptionLabel}
              </Typography>
              <RichTextEditorLazy
                value={initial.descriptionHtml}
                onChange={(html) => set("descriptionHtml", html)}
                labelId={descLabelId}
                describedBy={descErrorId}
                invalid={Boolean(errors.descriptionHtml)}
              />
              <FormHelperText id={descErrorId} error={Boolean(errors.descriptionHtml)}>
                {err("descriptionHtml", PROJECT_LIMITS.description) ??
                  `${text.editorHint} ${counterText(t, isEmptyDescription(values.descriptionHtml) ? 0 : measure(values.descriptionHtml, PROJECT_LIMITS.description), PROJECT_LIMITS.description)}`}
              </FormHelperText>
            </Box>,
          )}

          {section(
            text.sectionDetails,
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label={text.startDate}
                  value={values.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  error={Boolean(errors.startDate)}
                  helperText={err("startDate")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label={text.endDate}
                  value={values.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                  error={Boolean(errors.endDate)}
                  helperText={err("endDate") ?? text.endDateHelp}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              {text_("course", text.course)}
              {text_("professor", text.professor)}
            </>,
          )}

          {section(
            text.sectionSkills,
            <>
              <TermsInput
                id="technologies"
                label={text.technologies}
                value={values.technologies}
                onChange={(v) => set("technologies", v)}
                max={PROJECT_LIMITS.technologies}
                error={err("technologies", PROJECT_LIMITS.term)}
              />
              <TermsInput
                id="tags"
                label={text.tags}
                value={values.tags}
                onChange={(v) => set("tags", v)}
                max={PROJECT_LIMITS.tags}
                error={err("tags", PROJECT_LIMITS.term)}
              />
            </>,
          )}

          {section(
            text.sectionLinks,
            <>
              {text_("liveDemoUrl", text.liveDemoUrl, { type: "url", placeholder: "https://" })}
              {text_("repoUrl", text.repoUrl, { type: "url", placeholder: "https://github.com/" })}
              {text_("heroImageUrl", text.heroImageUrl, { type: "url", placeholder: "https://" })}
              <UploadControl
                kind="image"
                sign={(req) =>
                  signUploadAction({
                    ...req,
                    purpose: "hero",
                    ...(mode === "edit" && projectId ? { projectId } : {}),
                  })
                }
                onUploaded={(fileUrl) => set("heroImageUrl", fileUrl)}
              />
              <Typography variant="subtitle2" component="h3">
                {text.links}
              </Typography>
              {values.links.map((row, i) => (
                <Stack
                  key={i}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ sm: "flex-start" }}
                >
                  <TextField
                    size="small"
                    label={`${text.linkLabel} ${i + 1}`}
                    value={row.label}
                    onChange={(e) =>
                      set(
                        "links",
                        values.links.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)),
                      )
                    }
                    error={Boolean(errors[`links.${i}`])}
                    helperText={err(`links.${i}`, PROJECT_LIMITS.linkLabel)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    type="url"
                    label={`${text.linkUrl} ${i + 1}`}
                    placeholder="https://"
                    value={row.url}
                    onChange={(e) =>
                      set(
                        "links",
                        values.links.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)),
                      )
                    }
                    error={Boolean(errors[`links.${i}`])}
                    sx={{ flex: 2 }}
                  />
                  <IconButton
                    aria-label={text.removeLink.replace("{n}", String(i + 1))}
                    onClick={() =>
                      set(
                        "links",
                        values.links.filter((_r, j) => j !== i),
                      )
                    }
                  >
                    <DeleteOutline />
                  </IconButton>
                </Stack>
              ))}
              {errors.links && (
                <FormHelperText error>{projectFieldError(t, "links", errors.links)}</FormHelperText>
              )}
              <Box>
                <Button
                  startIcon={<AddIcon />}
                  disabled={values.links.length >= PROJECT_LIMITS.links}
                  onClick={() => set("links", [...values.links, { label: "", url: "" }])}
                >
                  {text.addLink}
                </Button>
              </Box>
            </>,
          )}

          <AttachmentsEditor
            key={attachments.map((a) => a.id).join(",")}
            projectId={mode === "edit" ? projectId : undefined}
            initial={attachments}
            draft={draftAttachments}
            onDraftChange={setDraftAttachments}
          />

          {section(
            text.sectionVisibility,
            <FormControl>
              <FormLabel id="vis-label">{text.visibility}</FormLabel>
              <RadioGroup
                aria-labelledby="vis-label"
                value={values.isPublic ? "public" : "private"}
                onChange={(e) => set("isPublic", e.target.value === "public")}
              >
                <FormControlLabel
                  value="public"
                  control={<Radio />}
                  label={
                    <>
                      <b>{text.visibilityPublic}</b> {text.visibilityPublicHelp}
                    </>
                  }
                />
                <FormControlLabel
                  value="private"
                  control={<Radio />}
                  label={
                    <>
                      <b>{text.visibilityPrivate}</b> {text.visibilityPrivateHelp}
                    </>
                  }
                />
              </RadioGroup>
              {values.isDraft && (
                <Alert
                  severity="info"
                  sx={{ mt: 1 }}
                  action={
                    <Button color="inherit" size="small" onClick={() => set("isDraft", false)}>
                      {text.publish}
                    </Button>
                  }
                >
                  {text.draftNote}
                </Alert>
              )}
            </FormControl>,
          )}

          {dirty && (
            <Typography variant="body2" color="text.secondary" role="status">
              {text.unsaved}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={1}
            sx={(theme) => ({
              position: "sticky",
              bottom: { xs: 72, sm: 0 },
              py: 1.5,
              bgcolor: "background.default",
              borderTop: `1px solid ${theme.palette.surface.line}`,
              zIndex: 2,
            })}
          >
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? text.saving : mode === "create" ? text.create : text.save}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => {
                // A button's client-side navigation bypasses the link guard: ask here.
                if (dirty && !window.confirm(t.profileEdit.leavePrompt)) return;
                setLeaving(true);
                router.push(mode === "edit" ? `/projects/${projectId}` : "/projects");
              }}
            >
              {text.cancel}
            </Button>
          </Stack>

          {mode === "edit" && projectId && (
            <Paper
              component="section"
              aria-label={text.dangerTitle}
              sx={{ p: { xs: 2.5, sm: 3 }, border: 2, borderColor: "error.main" }}
            >
              <Typography variant="h6" component="h2">
                {text.dangerTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {text.dangerBody}
              </Typography>
              <DeleteProjectDialog
                projectId={projectId}
                name={initial.title}
                onDeleted={() => setLeaving(true)}
              />
            </Paper>
          )}
        </Stack>
      </Box>
    </PageContainer>
  );
};
