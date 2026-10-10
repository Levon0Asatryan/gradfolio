"use client";

import { type FC, type ReactNode, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { Panel } from "@/components/layout/Panel";
import type { ProjectTeamMember, TeamMember } from "@/lib/api/types";
import { inviteAction, leaveAction, removeMemberAction } from "@/lib/team/actions";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";
import { AddTeammateDialog } from "./AddTeammateDialog";
import { teamErrorText } from "./teamErrors";

type Row = {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
  userId: string | null;
  status: "pending" | "accepted" | "rejected";
};

type Confirm = { kind: "remove" | "cancel" | "external" | "leave"; row: Row };

export interface TeamSectionProps {
  projectId: string;
  projectTitle: string;
  isOwner: boolean;
  isDraft: boolean;
  /** The public team (accepted members), what everyone sees. */
  members: ProjectTeamMember[];
  /** The owner's view, every status; `null` for anyone else. */
  managed: TeamMember[] | null;
  /** The owner's team could not be loaded. */
  managedFailed?: boolean;
  /** The signed-in viewer's account id, to offer "Leave" on their own accepted row. */
  viewerUserId: string | null;
  /** The panel's title; the project page uses the default ("Team Members"). */
  title?: string;
  /** A line under the title (the /teams page: the owner, a link to the project). */
  note?: ReactNode;
  /** Where "Leave project" goes afterwards; the project may no longer be readable. */
  leaveRedirect?: string;
}

/**
 * The project page's team. Everyone sees the accepted members. The owner also sees pending and
 * declined rows and can add, invite again and remove; a teammate can leave. Presentation only:
 * the API checks ownership on every write (404 for anyone else).
 */
export const TeamSection: FC<TeamSectionProps> = ({
  projectId,
  projectTitle,
  isOwner,
  isDraft,
  members,
  managed,
  managedFailed = false,
  viewerUserId,
  title,
  note,
  leaveRedirect = "/projects?flash=left",
}) => {
  const { t } = useLanguage();
  const text = t.team;
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  const rows: Row[] =
    isOwner && managed ? managed : members.map((m) => ({ ...m, status: "accepted" as const }));

  const done = (message: string) => {
    setToast(message);
    router.refresh();
  };

  async function inviteAgain(row: Row) {
    if (busy || !row.userId) return;
    setBusy(true);
    setProblem(null);
    try {
      const result = await inviteAction(projectId, row.userId, row.role);
      if (result.ok) done(text.invited.replace("{name}", row.name));
      else setProblem(teamErrorText(result.code, t));
    } catch {
      setProblem(text.errFailed);
    } finally {
      setBusy(false);
    }
  }

  async function runConfirmed() {
    if (!confirm || busy) return;
    const { kind, row } = confirm;
    setBusy(true);
    setProblem(null);
    try {
      const result =
        kind === "leave"
          ? await leaveAction(projectId)
          : await removeMemberAction(projectId, row.id);
      if (!result.ok) {
        setProblem(teamErrorText(result.code, t));
        return;
      }
      setConfirm(null);
      if (kind === "leave") {
        // The project may no longer be readable: go to the list, with its toast.
        router.push(leaveRedirect);
        return;
      }
      done((kind === "cancel" ? text.inviteCancelled : text.removed).replace("{name}", row.name));
    } catch {
      setProblem(text.errFailed);
    } finally {
      setBusy(false);
    }
  }

  if (!isOwner && rows.length === 0) return null;

  const confirmCopy = (c: Confirm) => {
    const v = { name: c.row.name, project: projectTitle };
    const fill = (s: string) =>
      s.replace(/\{(\w+)\}/g, (_, k: string) => v[k as keyof typeof v] ?? "");
    switch (c.kind) {
      case "leave":
        return {
          title: fill(text.leaveTitle),
          body: fill(text.leaveBody),
          button: text.leaveConfirm,
        };
      case "cancel":
        return {
          title: fill(text.cancelInviteTitle),
          body: fill(text.cancelInviteBody),
          button: text.cancelInviteConfirm,
        };
      case "external":
        return {
          title: fill(text.removeExternalTitle),
          body: fill(text.removeBody),
          button: text.removeConfirm,
        };
      default:
        return {
          title: fill(text.removeTitle),
          body: fill(text.removeBody),
          button: text.removeConfirm,
        };
    }
  };
  const copy = confirm ? confirmCopy(confirm) : null;

  return (
    <>
      <Panel
        title={title ?? t.common.teamMembers}
        action={
          isOwner ? (
            <Button
              variant="outlined"
              startIcon={<PersonAddOutlined />}
              onClick={() => {
                setProblem(null);
                setAdding(true);
              }}
              sx={{ minHeight: 44 }}
            >
              {text.add}
            </Button>
          ) : undefined
        }
      >
        {note}
        {isOwner && managedFailed && (
          <Alert
            severity="error"
            role="alert"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => router.refresh()}
                sx={{ minHeight: 44 }}
              >
                {text.retry}
              </Button>
            }
          >
            {text.listError}
          </Alert>
        )}
        {problem && !confirm && (
          <Alert severity="error" role="alert">
            {problem}
          </Alert>
        )}

        {rows.length === 0 && isOwner && !managedFailed ? (
          <Box
            sx={(theme) => ({
              p: 2,
              borderRadius: 2,
              border: `2px dashed ${theme.palette.divider}`,
            })}
          >
            <Typography variant="body2" color="text.secondary">
              {text.emptyPrompt}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {rows.map((row) => {
              const own = !isOwner && viewerUserId !== null && row.userId === viewerUserId;
              return (
                <ListItem
                  key={row.id}
                  divider
                  sx={{ flexWrap: "wrap", gap: 1, alignItems: "flex-start" }}
                  secondaryAction={undefined}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={safeHttpsUrl(row.avatarUrl) ?? undefined}
                      alt=""
                      sx={{ width: 36, height: 36 }}
                    >
                      {row.name.trim().charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    sx={{ minWidth: 0, flex: "1 1 120px" }}
                    primary={
                      row.userId ? (
                        <Link href={`/profile/${row.userId}`} underline="hover">
                          {row.name}
                        </Link>
                      ) : (
                        <Typography component="span" variant="subtitle2">
                          {row.name}
                        </Typography>
                      )
                    }
                    secondary={
                      row.status === "pending"
                        ? [row.role, text.pendingHint.replace("{name}", row.name)]
                            .filter(Boolean)
                            .join(" · ")
                        : (row.role ?? undefined)
                    }
                    slotProps={{ primary: { sx: { overflowWrap: "anywhere" } } }}
                  />
                  {row.status !== "accepted" && (
                    <Chip
                      size="small"
                      color={row.status === "pending" ? "warning" : "default"}
                      variant="outlined"
                      label={row.status === "pending" ? text.pending : text.declined}
                    />
                  )}
                  {isOwner && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {row.status === "rejected" && row.userId && (
                        <Button
                          size="small"
                          disabled={busy}
                          aria-label={text.inviteAgainAria.replace("{name}", row.name)}
                          onClick={() => void inviteAgain(row)}
                          sx={{ minHeight: 44 }}
                        >
                          {text.inviteAgain}
                        </Button>
                      )}
                      <IconButton
                        aria-label={(row.status === "pending"
                          ? text.cancelInviteAria
                          : text.removeAria
                        ).replace("{name}", row.name)}
                        onClick={() => {
                          setProblem(null);
                          setConfirm({
                            kind:
                              row.status === "pending"
                                ? "cancel"
                                : row.userId
                                  ? "remove"
                                  : "external",
                            row,
                          });
                        }}
                        sx={{ width: 44, height: 44 }}
                      >
                        {row.status === "pending" ? <CloseOutlined /> : <DeleteOutline />}
                      </IconButton>
                    </Box>
                  )}
                  {own && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setProblem(null);
                        setConfirm({ kind: "leave", row });
                      }}
                      sx={{ minHeight: 44 }}
                    >
                      {text.leave}
                    </Button>
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </Panel>

      {isOwner && (
        <AddTeammateDialog
          open={adding}
          projectId={projectId}
          isDraft={isDraft}
          onClose={() => setAdding(false)}
          onDone={(message) => {
            setAdding(false);
            done(message);
          }}
        />
      )}

      <Dialog
        open={confirm !== null}
        onClose={() => !busy && setConfirm(null)}
        aria-labelledby="team-confirm-title"
        aria-describedby="team-confirm-body"
        // `autoFocus` is lost here: the dialog's content is `visibility: hidden` while it fades in,
        // so the browser refuses the focus and MUI falls back to the dialog frame. Focus Cancel
        // once the dialog is visible, so Enter can never confirm a removal by accident.
        slotProps={{ transition: { onEntered: () => cancelButton.current?.focus() } }}
      >
        <DialogTitle id="team-confirm-title">{copy?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="team-confirm-body">{copy?.body}</DialogContentText>
          {problem && (
            <Alert severity="error" role="alert" sx={{ mt: 2 }}>
              {problem}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            ref={cancelButton}
            onClick={() => setConfirm(null)}
            disabled={busy}
            sx={{ minHeight: 44 }}
          >
            {text.cancel}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void runConfirmed()}
            disabled={busy}
            sx={{ minHeight: 44 }}
          >
            {copy?.button}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToast(null)} closeText={text.close}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
};
