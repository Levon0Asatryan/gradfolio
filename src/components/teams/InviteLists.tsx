"use client";

import { type FC, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { teamErrorText } from "@/components/team/teamErrors";
import type { Dictionary } from "@/data/locales/types";
import type { IncomingInvite, OutgoingInvite } from "@/lib/api/types";
import { respondToInviteAction } from "@/lib/notifications/actions";
import { removeMemberAction } from "@/lib/team/actions";
import { formatDate } from "@/utils/helpers/formatDate";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Fixed locale and UTC: the server and the browser must print the same text (hydration). */
const DATE_OPTIONS = {
  en: { locale: "en-US", timeZone: "UTC" },
  ru: { locale: "ru-RU", timeZone: "UTC" },
  am: { locale: "hy-AM", timeZone: "UTC" },
} as const;

const metaLine = (parts: Array<string | null | undefined>) => parts.filter(Boolean).join(" · ");

const rowSx = (theme: import("@mui/material/styles").Theme) => ({
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  gap: 1.5,
  py: 1.5,
  borderBottom: `1px solid ${theme.palette.divider}`,
});

const roleText = (role: string | null, t: Dictionary) =>
  role ? fill(t.teamsPage.roleAs, { role }) : null;

/** "Invited by {name}": the name sits where the translation puts it, as a link when it can be one. */
const WithPerson: FC<{ template: string; id: string | null; name: string }> = ({
  template,
  id,
  name,
}) => {
  const [before = "", after = ""] = template.split("{name}");
  return (
    <>
      {before}
      <Person id={id} name={name} />
      {after}
    </>
  );
};

/** A person's name: a profile link only when the API gave a visible account. */
const Person: FC<{ id: string | null; name: string }> = ({ id, name }) =>
  id ? (
    <Link component={NextLink} href={`/profile/${id}`} underline="hover">
      {name}
    </Link>
  ) : (
    <>{name}</>
  );

/** An invitation the caller can answer. A pending invitee reads only the title, so there is no project link. */
export const IncomingRow: FC<{ invite: IncomingInvite; onDone: (message: string) => void }> = ({
  invite,
  onDone,
}) => {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const title = invite.project.title;

  async function answer(decision: "accept" | "reject") {
    setBusy(true);
    setProblem(null);
    try {
      const result = await respondToInviteAction(invite.project.id, decision);
      if (result.ok) {
        onDone(
          fill(decision === "accept" ? t.teamsPage.joined : t.teamsPage.declinedToast, {
            project: title,
          }),
        );
        router.refresh();
      } else if (result.code === "NOT_FOUND" || result.code === "INVITE_NOT_PENDING") {
        // Withdrawn or answered elsewhere: show what is true now.
        setProblem(t.teamsPage.gone);
        router.refresh();
      } else {
        setProblem(teamErrorText(result.code, t));
      }
    } catch {
      setProblem(t.team.errFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box component="li" sx={rowSx}>
      <Box sx={{ flex: "1 1 220px", minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <WithPerson
            template={t.teamsPage.invitedBy}
            id={invite.invitedBy.id}
            name={invite.invitedBy.name}
          />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {metaLine([
            roleText(invite.role, t),
            formatDate(invite.invitedAt, DATE_OPTIONS[language]),
          ])}
        </Typography>
        {problem && (
          <Alert severity="error" role="alert" sx={{ mt: 1 }}>
            {problem}
          </Alert>
        )}
      </Box>
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          size="small"
          disabled={busy}
          aria-label={fill(t.notifications.acceptLabel, { project: title })}
          onClick={() => void answer("accept")}
          sx={{ minHeight: 44, minWidth: 44, fontWeight: 700 }}
        >
          {t.notifications.accept}
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled={busy}
          aria-label={fill(t.notifications.declineLabel, { project: title })}
          onClick={() => void answer("reject")}
          sx={{ minHeight: 44, minWidth: 44, fontWeight: 700 }}
        >
          {t.notifications.decline}
        </Button>
      </Stack>
    </Box>
  );
};

/** An invitation the caller sent that nobody has answered; the owner can cancel it behind a confirm. */
export const OutgoingRow: FC<{ invite: OutgoingInvite; onDone: (message: string) => void }> = ({
  invite,
  onDone,
}) => {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const name = invite.invitee.name;

  async function cancel() {
    setBusy(true);
    setProblem(null);
    try {
      const result = await removeMemberAction(invite.project.id, invite.id);
      if (result.ok || result.code === "NOT_FOUND") {
        // A 404 means it is already gone (answered or cancelled in another tab).
        setConfirming(false);
        onDone(t.team.inviteCancelled);
        router.refresh();
      } else {
        setProblem(teamErrorText(result.code, t));
      }
    } catch {
      setProblem(t.team.errFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box component="li" sx={rowSx}>
      <Avatar
        src={safeHttpsUrl(invite.invitee.avatarUrl) ?? undefined}
        alt=""
        sx={{ width: 36, height: 36 }}
      >
        {name.trim().charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
          <WithPerson template={t.teamsPage.inviteeLabel} id={invite.invitee.id} name={name} />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Link component={NextLink} href={`/projects/${invite.project.id}`} underline="hover">
            {invite.project.title}
          </Link>
          {" · "}
          {metaLine([
            roleText(invite.role, t),
            formatDate(invite.invitedAt, DATE_OPTIONS[language]),
          ])}
        </Typography>
      </Box>
      <Button
        size="small"
        color="error"
        aria-label={fill(t.team.cancelInviteAria, { name })}
        onClick={() => {
          setProblem(null);
          setConfirming(true);
        }}
        sx={{ minHeight: 44, minWidth: 44 }}
      >
        {t.team.cancelInviteConfirm}
      </Button>
      <Dialog
        open={confirming}
        onClose={() => !busy && setConfirming(false)}
        aria-labelledby={`cancel-invite-${invite.id}`}
        slotProps={{
          transition: {
            onEntered: () => document.getElementById(`cancel-keep-${invite.id}`)?.focus(),
          },
        }}
      >
        <DialogTitle id={`cancel-invite-${invite.id}`}>
          {fill(t.team.cancelInviteTitle, { name })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{fill(t.team.cancelInviteBody, { name })}</DialogContentText>
          {problem && (
            <Alert severity="error" role="alert" sx={{ mt: 2 }}>
              {problem}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            id={`cancel-keep-${invite.id}`}
            onClick={() => setConfirming(false)}
            disabled={busy}
            sx={{ minHeight: 44 }}
          >
            {t.team.cancel}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void cancel()}
            disabled={busy}
            sx={{ minHeight: 44 }}
          >
            {t.team.cancelInviteConfirm}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
