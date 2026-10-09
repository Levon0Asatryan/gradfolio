"use client";

import { type FC } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import DoneOutlined from "@mui/icons-material/DoneOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Dictionary } from "@/data/locales/types";
import { safeAppPath } from "@/lib/notifications/safeLink";
import type { Notification } from "@/lib/api/types";
import { formatDate } from "@/utils/helpers/formatDate";
import { useNotifications } from "./NotificationsProvider";

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * The sentence, in the reader's language, from `type` + `params` (the API sends its English
 * `title` only as a fallback). An unknown type, or a row written before `params` existed,
 * shows the fallback.
 */
export function notificationText(item: Notification, t: Dictionary): string {
  const p = item.params;
  if (p === null) return item.title;
  const values = {
    actor: p.actorName,
    project: p.projectTitle,
    role: p.role ?? "",
  };
  const text = t.notifications.text;
  switch (item.type) {
    case "team_invite":
      return fill(p.role ? text.teamInviteRole : text.teamInvite, values);
    case "team_accepted":
      return fill(text.teamAccepted, values);
    case "team_rejected":
      return fill(text.teamRejected, values);
    case "team_left":
      return fill(text.teamLeft, values);
    default:
      return item.title;
  }
}

/** One row. Reading it (the link, or the check button) marks it read. */
export const NotificationItem: FC<{ item: Notification; onNavigate: () => void }> = ({
  item,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const n = t.notifications;
  const { markRead, failedIds, respondingIds, respond } = useNotifications();
  const text = notificationText(item, t);
  const href = safeAppPath(item.link);
  const failed = failedIds.has(item.id);
  const responding = respondingIds.has(item.id);
  const projectTitle = item.params?.projectTitle ?? "";
  const actionable =
    item.type === "team_invite" && item.invite?.status === "pending" && item.params !== null;

  const body = (
    <>
      <Typography
        variant="body2"
        sx={{ fontWeight: item.read ? 500 : 800, overflowWrap: "anywhere" }}
      >
        {text}
      </Typography>
      {item.invite && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {n.invite[item.invite.status]}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {formatDate(item.createdAt, { withTime: true })}
      </Typography>
    </>
  );

  return (
    <Box
      component="li"
      sx={(theme) => ({
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        px: 2,
        py: 1.25,
        borderBottom: `1px solid ${theme.palette.surface.line}`,
        bgcolor: item.read ? "transparent" : theme.palette.surface.soft,
      })}
    >
      <Box
        aria-hidden={item.read}
        sx={{
          width: 10,
          height: 10,
          mt: 0.75,
          flex: "none",
          borderRadius: "50%",
          bgcolor: item.read ? "transparent" : "primary.main",
        }}
      />
      {!item.read && (
        <Box component="span" sx={visuallyHidden}>
          {n.unread}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {href ? (
          <Box
            component={Link}
            href={href}
            onClick={() => {
              void markRead(item.id);
              onNavigate();
            }}
            sx={{
              display: "block",
              color: "inherit",
              textDecoration: "none",
              borderRadius: 1,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {body}
          </Box>
        ) : (
          body
        )}
        {actionable && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              disabled={responding}
              aria-label={fill(n.acceptLabel, { project: projectTitle })}
              onClick={() => void respond(item.id, "accept")}
              sx={{ minHeight: 44, minWidth: 44, fontWeight: 700 }}
            >
              {n.accept}
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={responding}
              aria-label={fill(n.declineLabel, { project: projectTitle })}
              onClick={() => void respond(item.id, "reject")}
              sx={{ minHeight: 44, minWidth: 44, fontWeight: 700 }}
            >
              {n.decline}
            </Button>
          </Stack>
        )}
        {failed && (
          <Typography variant="caption" color="error" role="alert" sx={{ display: "block" }}>
            {n.actionFailed}
          </Typography>
        )}
      </Box>
      {!item.read && (
        <IconButton
          aria-label={fill(n.markReadItem, { text })}
          onClick={() => void markRead(item.id)}
          sx={{ width: 44, height: 44, flex: "none", mt: -0.5 }}
        >
          <DoneOutlined fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;
