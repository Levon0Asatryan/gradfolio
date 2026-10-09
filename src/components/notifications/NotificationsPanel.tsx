"use client";

import { type FC, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Close from "@mui/icons-material/Close";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { NotificationItem } from "./NotificationItem";
import { useNotifications } from "./NotificationsProvider";

export const PANEL_TITLE_ID = "notifications-panel-title";

/**
 * The bell's panel: the list is read each time it mounts (it mounts when the bell opens).
 * Loading, empty and error states; "Mark all as read"; "Load more" for the cursor.
 */
export const NotificationsPanel: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useLanguage();
  const n = t.notifications;
  const {
    items,
    count,
    listState,
    listError,
    hasMore,
    loadingMore,
    moreFailed,
    markAllFailed,
    loadList,
    loadMore,
    markAllRead,
  } = useNotifications();

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const unread = items.some((i) => !i.read);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, maxHeight: "inherit" }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={(theme) => ({
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.surface.line}`,
        })}
      >
        <Typography
          id={PANEL_TITLE_ID}
          variant="subtitle1"
          component="h2"
          sx={{ flex: 1, fontWeight: 800 }}
        >
          {n.title}
        </Typography>
        <Button
          size="small"
          onClick={() => void markAllRead()}
          disabled={!unread && !(count && count > 0)}
          sx={{ minHeight: 44, fontWeight: 700 }}
        >
          {n.markAllRead}
        </Button>
        <IconButton aria-label={n.close} onClick={onClose} sx={{ width: 44, height: 44 }}>
          <Close />
        </IconButton>
      </Stack>

      <Box sx={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        {markAllFailed && (
          <Alert severity="error" role="alert" sx={{ m: 1.5 }}>
            {n.actionFailed}
          </Alert>
        )}

        {listState === "loading" && items.length === 0 && (
          <Stack spacing={1.5} sx={{ p: 2 }} aria-busy="true" role="status" aria-label={n.loading}>
            {[0, 1, 2].map((k) => (
              <Skeleton key={k} variant="rounded" height={64} />
            ))}
          </Stack>
        )}

        {listState === "error" && (
          <Stack spacing={1.5} sx={{ p: 2 }} alignItems="flex-start">
            <Alert severity="error" role="alert" sx={{ width: "100%" }}>
              {listError === "UNAUTHENTICATED"
                ? n.signIn
                : listError === "RATE_LIMITED"
                  ? n.rateLimited
                  : n.error}
            </Alert>
            {listError === "UNAUTHENTICATED" ? (
              // A plain link: /auth/* is never client-routed (CLAUDE.md, Auth).
              <Button component="a" href="/auth/login" sx={{ minHeight: 44 }}>
                {n.signIn}
              </Button>
            ) : (
              <Button onClick={() => void loadList()} sx={{ minHeight: 44 }}>
                {n.retry}
              </Button>
            )}
          </Stack>
        )}

        {listState === "ready" && items.length === 0 && (
          <Stack alignItems="center" spacing={1} sx={{ px: 3, py: 5, textAlign: "center" }}>
            <NotificationsNoneOutlined color="disabled" sx={{ fontSize: 40 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {n.empty}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {n.emptyHint}
            </Typography>
          </Stack>
        )}

        {items.length > 0 && listState !== "error" && (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {items.map((item) => (
              <NotificationItem key={item.id} item={item} onNavigate={onClose} />
            ))}
          </Box>
        )}

        {listState === "ready" && hasMore && (
          <Stack alignItems="center" spacing={1} sx={{ p: 1.5 }}>
            {moreFailed && (
              <Alert severity="error" role="alert" sx={{ width: "100%" }}>
                {n.error}
              </Alert>
            )}
            <Button onClick={() => void loadMore()} disabled={loadingMore} sx={{ minHeight: 44 }}>
              {loadingMore ? <CircularProgress size={20} aria-label={n.loading} /> : n.loadMore}
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};
