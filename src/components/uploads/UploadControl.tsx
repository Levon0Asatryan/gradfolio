"use client";

import { FC, useId, useRef, useState } from "react";
import { Alert, Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { putFile } from "@/lib/uploads/putFile";
import { acceptAttribute, checkFile, maxBytesFor, type UploadKind } from "@/lib/uploads/rules";

/** What the server action that talks to the API returns: a signed PUT, or why not. */
export type SignResult =
  | { ok: true; uploadUrl: string; headers: Record<string, string>; fileUrl: string }
  | { ok: false; code: string };

export interface UploadControlProps {
  kind: UploadKind;
  /**
   * Asks the server for a signed upload (a server action: the Auth0 token stays there, Q11).
   * Receives only the type and size, never the file.
   */
  sign: (request: { contentType: string; size: number }) => Promise<SignResult>;
  /** The file is in the bucket: `fileUrl` goes into the form field, and the normal write registers it. */
  onUploaded: (fileUrl: string, file: { name: string; type: string }) => void;
}

type State =
  | { name: "idle" }
  | { name: "uploading"; file: File; progress: number }
  | { name: "done"; file: File }
  | { name: "failed"; file: File | null; message: string; retryable: boolean };

/**
 * "Upload a file" next to a URL field (docs/m4-plan.md §5). A real file input behind a
 * button, so the keyboard works; every state is announced; a refusal says why and keeps
 * the URL field usable. Checks the type and size first so the common failures never leave
 * the browser (the signature enforces them anyway).
 */
export const UploadControl: FC<UploadControlProps> = ({ kind, sign, onUploaded }) => {
  const { t } = useLanguage();
  const text = t.projects.upload;
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hintId = useId();
  const [state, setState] = useState<State>({ name: "idle" });

  const fail = (file: File | null, message: string, retryable = true) =>
    setState({ name: "failed", file, message, retryable });

  async function start(file: File) {
    const verdict = checkFile(file, kind);
    if (verdict === "type")
      return fail(file, kind === "image" ? text.errorImageOnly : text.errorType, false);
    if (verdict === "empty") return fail(file, text.errorEmpty, false);
    if (verdict === "too_big") {
      const max = (maxBytesFor(file.type, kind) ?? 0) / (1024 * 1024);
      return fail(file, text.errorTooBig.replace("{max}", String(max)), false);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setState({ name: "uploading", file, progress: 0 });
    let signed: SignResult;
    try {
      signed = await sign({ contentType: file.type, size: file.size });
    } catch {
      return fail(file, text.errorSign);
    }
    if (controller.signal.aborted) return setState({ name: "idle" });
    if (!signed.ok) {
      if (signed.code === "LIMIT_REACHED") return fail(file, text.errorSignLimit, false);
      if (signed.code === "UPLOAD_UNAVAILABLE") return fail(file, text.errorUnavailable, false);
      return fail(file, text.errorSign);
    }

    const result = await putFile({
      url: signed.uploadUrl,
      headers: signed.headers,
      file,
      signal: controller.signal,
      onProgress: (progress) => setState({ name: "uploading", file, progress }),
    });
    if (result.ok) {
      setState({ name: "done", file });
      onUploaded(signed.fileUrl, { name: file.name, type: file.type });
    } else if (result.reason === "aborted") {
      setState({ name: "idle" });
    } else if (result.reason === "unreachable") {
      // No answer after a good signature: most often this origin is not in the bucket's CORS
      // rule (a preview). Retrying cannot fix that, so say so and point to the URL field.
      fail(file, text.errorUnavailable, false);
    } else {
      fail(file, text.errorRejected);
    }
  }

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // the same file can be chosen again after a failure
    if (file) void start(file);
  };

  const busy = state.name === "uploading";
  const picked =
    state.name === "uploading" || state.name === "done" || state.name === "failed" ? state : null;
  const fileName = picked && picked.file ? picked.file.name : "";

  return (
    <Stack spacing={1}>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={acceptAttribute(kind)}
        onChange={onPick}
        aria-describedby={hintId}
        data-testid="upload-input"
        tabIndex={-1}
      />
      <Box>
        <Button
          variant="outlined"
          startIcon={<UploadFileOutlined />}
          disabled={busy}
          aria-describedby={hintId}
          onClick={() => inputRef.current?.click()}
        >
          {kind === "image" ? text.chooseImage : text.chooseFile}
        </Button>
      </Box>
      <Typography id={hintId} variant="caption" color="text.secondary">
        {kind === "image" ? text.limitsImage : text.limitsFile}
      </Typography>

      {state.name === "uploading" && (
        <Stack spacing={0.5}>
          <Typography variant="body2">{text.uploading.replace("{name}", fileName)}</Typography>
          <LinearProgress
            variant="determinate"
            value={Math.round(state.progress * 100)}
            aria-label={text.progress}
          />
          <Box>
            <Button size="small" onClick={() => abortRef.current?.abort()}>
              {text.cancelUpload}
            </Button>
          </Box>
        </Stack>
      )}
      {state.name === "done" && (
        <Typography variant="body2" role="status">
          {text.uploaded.replace("{name}", fileName)}
        </Typography>
      )}
      {state.name === "failed" && (
        <Alert
          severity="error"
          role="alert"
          action={
            state.retryable && state.file ? (
              <Button color="inherit" size="small" onClick={() => void start(state.file as File)}>
                {text.retry}
              </Button>
            ) : undefined
          }
        >
          {state.message}
        </Alert>
      )}
    </Stack>
  );
};
