"use client";

import { FC, memo, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { Activity } from "@/lib/api/types";
import { isActivityKey } from "@/lib/dashboard/activityKeys";
import { loadMoreActivitiesAction } from "@/lib/dashboard/actions";
import { formatDay } from "@/utils/helpers/formatDay";
import { Panel } from "@/components/layout/Panel";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ActivityFeedProps {
  /** The newest entries; `null`: the feed could not be loaded (an error, never "no activity"). */
  items: Activity[] | null;
  /** The newest few are all there is (no "Show more"). */
  initialPageSize?: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Each placeholder through a function replacer: a project's name is text, never a pattern. */
const interpolate = (text: string, params: Record<string, string | number> | null) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(params?.[key] ?? ""));

/** The text of one entry, in the reader's language. An unknown key is a neutral line, never the key. */
function entryText(activity: Activity, templates: Record<string, string>, unknown: string): string {
  if (!isActivityKey(activity.translationKey)) return unknown;
  const template = templates[activity.translationKey];
  return template === undefined ? unknown : interpolate(template, activity.translationParams);
}

/** The project an entry is about, when it still exists and the id is one of ours. */
function entryHref(activity: Activity): string | null {
  if (activity.translationKey === "projectDeleted") return null;
  const id = activity.translationParams?.projectId;
  return typeof id === "string" && UUID.test(id) ? `/projects/${id}` : null;
}

const ActivityFeed: FC<ActivityFeedProps> = ({ items, initialPageSize = 5 }) => {
  const { t, language } = useLanguage();
  const templates: Record<string, string> = t.dashboard.activity;
  const [shown, setShown] = useState<Activity[] | null>(items);
  // `undefined`: still on the dashboard's own few; a string: the cursor of the next page;
  // `null`: nothing more.
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  // The page brought different entries (an accepted invite, a new project): start from them.
  // A server action refreshes the route too, with the same entries as before: the signature
  // (not the array's identity) tells the two apart, so "Show more" is not undone by its own refresh.
  const signature = items === null ? null : items.map((a) => a.id).join("|");
  const seen = useRef(signature);
  useEffect(() => {
    if (seen.current === signature) return;
    seen.current = signature;
    setShown(items);
    setCursor(undefined);
    setFailed(false);
  }, [signature, items]);

  if (shown === null) {
    return (
      <Panel title={t.dashboard.activityFeed}>
        <Alert severity="error">{t.dashboard.activityLoadError}</Alert>
      </Panel>
    );
  }

  const canLoadMore = cursor === undefined ? shown.length >= initialPageSize : cursor !== null;

  const loadMore = () =>
    startTransition(async () => {
      setFailed(false);
      const result = await loadMoreActivitiesAction(cursor ? { cursor } : {});
      if (!result.ok) {
        setFailed(true);
        return;
      }
      // The first "Show more" replaces the few the dashboard came with by the newest page.
      setShown((current) => {
        if (cursor === undefined) return result.items;
        const seen = new Set((current ?? []).map((a) => a.id));
        return [...(current ?? []), ...result.items.filter((a) => !seen.has(a.id))];
      });
      setCursor(result.nextCursor);
    });

  return (
    <Panel title={t.dashboard.activityFeed}>
      {shown.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t.dashboard.noRecentActivity}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {shown.map((a) => {
            const href = entryHref(a);
            const text = entryText(a, templates, t.dashboard.activityUnknown);
            return (
              <Box
                component="li"
                key={a.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  py: 1.5,
                  borderTop: 1,
                  borderColor: "divider",
                  "&:first-of-type": { borderTop: 0, pt: 0 },
                  "&:last-of-type": { pb: 0 },
                }}
              >
                <Box
                  aria-hidden
                  sx={({ palette }) => ({
                    width: 36,
                    height: 36,
                    flex: "none",
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    color: palette.primary.main,
                    bgcolor: `color-mix(in srgb, ${palette.primary.main} 12%, ${palette.background.paper})`,
                  })}
                >
                  {a.type === "project" ? (
                    <EditIcon fontSize="small" />
                  ) : (
                    <VisibilityIcon fontSize="small" />
                  )}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
                    {href ? (
                      <Link href={href} style={{ color: "inherit" }}>
                        {text}
                      </Link>
                    ) : (
                      text
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" suppressHydrationWarning>
                    {formatDay(a.timestamp, language)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
      {failed && (
        <Alert severity="error" role="alert" sx={{ mt: 2 }}>
          {t.dashboard.activityMoreError}
        </Alert>
      )}
      {canLoadMore && (
        <Button
          onClick={loadMore}
          disabled={pending}
          variant="outlined"
          sx={{ mt: 2, minHeight: 44 }}
        >
          {t.dashboard.activityLoadMore}
        </Button>
      )}
    </Panel>
  );
};

export default memo(ActivityFeed);
