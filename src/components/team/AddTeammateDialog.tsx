"use client";

import { type FC, useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { LookupUser } from "@/lib/api/types";
import { addExternalAction, inviteAction } from "@/lib/team/actions";
import { parseLookupQuery } from "@/lib/team/form";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";
import { teamErrorText } from "./teamErrors";

const DEBOUNCE_MS = 300;

type Search =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "done"; items: LookupUser[] }
  | { state: "error"; code: string };

/**
 * "Add a teammate": find a user (typeahead over public profiles, then an invitation) or add a
 * name with no account. Failures stay in the dialog with the form intact.
 */
export const AddTeammateDialog: FC<{
  open: boolean;
  projectId: string;
  isDraft: boolean;
  onClose: () => void;
  /** A success: the message for the toast. The parent refreshes the list. */
  onDone: (message: string) => void;
}> = ({ open, projectId, isDraft, onClose, onDone }) => {
  const { t } = useLanguage();
  const text = t.team;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [tab, setTab] = useState<"find" | "external">("find");
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<LookupUser | null>(null);
  const [search, setSearch] = useState<Search>({ state: "idle" });
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{
    code: string;
    field?: "name" | "role";
    error?: string;
  } | null>(null);
  const request = useRef(0);

  // Reset on open: a closed dialog keeps nothing of the last use.
  useEffect(() => {
    if (!open) return;
    setTab("find");
    setInput("");
    setPicked(null);
    setSearch({ state: "idle" });
    setRole("");
    setName("");
    setFailure(null);
    setBusy(false);
  }, [open]);

  // The typeahead: 3 characters, 300 ms after the last key; an older answer arriving late is dropped.
  useEffect(() => {
    const id = ++request.current;
    const q = parseLookupQuery(input);
    if (q === null || (picked && picked.name === input)) {
      setSearch({ state: "idle" });
      return;
    }
    setSearch({ state: "loading" });
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/lookup?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const body: unknown = await response.json().catch(() => undefined);
          const code =
            typeof body === "object" &&
            body !== null &&
            typeof (body as { code?: unknown }).code === "string"
              ? (body as { code: string }).code
              : "ERROR";
          if (id === request.current) setSearch({ state: "error", code });
          return;
        }
        const body = (await response.json()) as { items: LookupUser[] };
        if (id === request.current) setSearch({ state: "done", items: body.items });
      } catch {
        if (id === request.current) setSearch({ state: "error", code: "ERROR" });
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, picked]);

  const close = () => {
    if (!busy) onClose();
  };

  async function submit(kind: "find" | "external") {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const result =
        kind === "find"
          ? picked
            ? await inviteAction(projectId, picked.id, role)
            : null
          : await addExternalAction(projectId, name, role);
      if (result === null) return;
      if (result.ok) {
        onDone(
          kind === "find" && picked
            ? text.invited.replace("{name}", picked.name)
            : text.externalAdded.replace("{name}", name.trim()),
        );
        return;
      }
      setFailure({ code: result.code, field: result.field, error: result.error });
    } catch {
      setFailure({ code: "ERROR" });
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (field: "name" | "role") =>
    failure?.field === field
      ? failure.error === "required"
        ? text.nameRequired
        : text.tooLong
      : undefined;
  const generalError = failure && !failure.field ? teamErrorText(failure.code, t) : null;
  const options = search.state === "done" ? search.items : picked ? [picked] : [];

  return (
    <Dialog
      open={open}
      onClose={close}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby="add-teammate-title"
    >
      <DialogTitle id="add-teammate-title">{text.addTitle}</DialogTitle>
      <Tabs
        value={tab}
        onChange={(_, value: "find" | "external") => {
          setTab(value);
          setFailure(null);
        }}
        aria-label={text.addTitle}
        variant="fullWidth"
      >
        <Tab
          value="find"
          label={text.tabFind}
          id="add-tab-find"
          aria-controls="add-panel-find"
          sx={{ minHeight: 48 }}
        />
        <Tab
          value="external"
          label={text.tabExternal}
          id="add-tab-external"
          aria-controls="add-panel-external"
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      <DialogContent>
        {generalError && (
          <Alert severity="error" role="alert" sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}

        {tab === "find" ? (
          <Box
            role="tabpanel"
            id="add-panel-find"
            aria-labelledby="add-tab-find"
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (picked && !isDraft) void submit("find");
            }}
          >
            {isDraft && <Alert severity="info">{text.draftNote}</Alert>}
            <Autocomplete<LookupUser>
              options={options}
              value={picked}
              inputValue={input}
              onInputChange={(_, value, reason) => {
                if (reason === "input" || reason === "clear") setPicked(null);
                setInput(value);
              }}
              onChange={(_, value) => setPicked(value)}
              filterOptions={(all) => all}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              loading={search.state === "loading"}
              loadingText={text.searching}
              noOptionsText={
                search.state === "error"
                  ? search.code === "RATE_LIMITED"
                    ? text.errRateLimited
                    : text.searchFailed
                  : search.state === "done"
                    ? text.noResults
                    : text.searchHint
              }
              renderOption={(props, option) => {
                // MUI passes `key` inside the props; React wants it set directly, not spread.
                // eslint-disable-next-line react/prop-types
                const { key, ...rest } = props;
                return (
                  <Box component="li" key={key} {...rest} sx={{ gap: 1.5, minHeight: 56 }}>
                    <Avatar
                      src={safeHttpsUrl(option.avatarUrl) ?? undefined}
                      alt=""
                      sx={{ width: 36, height: 36 }}
                    >
                      {option.name.trim().charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2">{option.name}</Typography>
                      {option.headline && (
                        <Typography variant="caption" color="text.secondary">
                          {option.headline}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={text.searchLabel}
                  helperText={text.searchHint}
                  autoFocus
                />
              )}
            />
            <TextField
              label={text.roleLabel}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              error={Boolean(fieldError("role"))}
              helperText={fieldError("role")}
            />
          </Box>
        ) : (
          <Box
            role="tabpanel"
            id="add-panel-external"
            aria-labelledby="add-tab-external"
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              void submit("external");
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {text.externalHint}
            </Typography>
            <TextField
              label={text.externalName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              error={Boolean(fieldError("name"))}
              helperText={fieldError("name")}
            />
            <TextField
              label={text.roleLabel}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              error={Boolean(fieldError("role"))}
              helperText={fieldError("role")}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={close} disabled={busy} sx={{ minHeight: 44 }}>
          {text.cancel}
        </Button>
        {tab === "find" ? (
          <Button
            variant="contained"
            onClick={() => void submit("find")}
            disabled={busy || !picked || isDraft}
            sx={{ minHeight: 44 }}
          >
            {text.sendInvite}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => void submit("external")}
            disabled={busy}
            sx={{ minHeight: 44 }}
          >
            {text.addExternal}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
