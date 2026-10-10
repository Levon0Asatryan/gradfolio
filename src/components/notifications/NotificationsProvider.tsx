"use client";

import {
  type FC,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  respondToInviteAction,
} from "@/lib/notifications/actions";
import type { Notification, NotificationPage, UnreadCount } from "@/lib/api/types";

/** How often the unread count is polled while the tab is visible (API plan §6). */
export const POLL_MS = 60_000;
/** After three failed polls in a row the interval doubles, up to this. */
const MAX_BACKOFF_MS = 5 * 60_000;
/** Focus and visibility events can arrive together; one fetch is enough. */
const MIN_GAP_MS = 2_000;
const PAGE_SIZE = 15;

export type ListState = "idle" | "loading" | "ready" | "error";

export interface NotificationsValue {
  /** `null` until known, and after a failed read: no badge, no noise. */
  count: number | null;
  items: Notification[];
  hasMore: boolean;
  listState: ListState;
  /** The code of the last failed list read (`UNAUTHENTICATED`, `RATE_LIMITED`, ...). */
  listError: string | null;
  loadingMore: boolean;
  /** The last "Load more" failed; the list stays. */
  moreFailed: boolean;
  /** Ids whose last mark-read failed, and whether the last mark-all failed. */
  failedIds: ReadonlySet<string>;
  markAllFailed: boolean;
  /** Notification ids whose invitation answer is in flight. */
  respondingIds: ReadonlySet<string>;
  loadList: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  respond: (id: string, decision: "accept" | "reject") => Promise<void>;
}

const inert: NotificationsValue = {
  count: null,
  items: [],
  hasMore: false,
  listState: "idle",
  listError: null,
  loadingMore: false,
  moreFailed: false,
  failedIds: new Set(),
  markAllFailed: false,
  respondingIds: new Set(),
  loadList: async () => {},
  loadMore: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  respond: async () => {},
};

const Context = createContext<NotificationsValue>(inert);

export const useNotifications = (): NotificationsValue => useContext(Context);

const withRead = (list: Notification[], ids: ReadonlySet<string> | "all", read: boolean) =>
  list.map((n) => (ids === "all" || ids.has(n.id) ? { ...n, read } : n));

type Read<T> = { ok: true; value: T } | { ok: false; code: string };

/** Same-origin route handlers: the browser never holds the API token (Q11). */
async function read<T>(url: string): Promise<Read<T>> {
  try {
    const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
    if (response.ok) return { ok: true, value: (await response.json()) as T };
    const body: unknown = await response.json().catch(() => undefined);
    const code =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { code?: unknown }).code === "string"
        ? (body as { code: string }).code
        : `HTTP_${response.status}`;
    return { ok: false, code };
  } catch {
    return { ok: false, code: "NETWORK" };
  }
}

/**
 * One source of truth for the bell, shared by the sidebar, the rail and the phone bar
 * (all are in the page; CSS shows one). The count is refreshed on mount, on navigation,
 * on focus and every `pollMs` while the tab is visible; the list is read when the panel
 * opens (API plan §6). Mounted for a signed-in user only.
 */
export const NotificationsProvider: FC<{ children: ReactNode; pollMs?: number }> = ({
  children,
  pollMs = POLL_MS,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [listState, setListState] = useState<ListState>("idle");
  const [listError, setListError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(new Set());
  const [markAllFailed, setMarkAllFailed] = useState(false);
  const [respondingIds, setRespondingIds] = useState<ReadonlySet<string>>(new Set());

  // A later request wins; an older answer arriving late is dropped.
  const listRequest = useRef(0);
  const countRequest = useRef(0);
  const lastCountAt = useRef(0);
  const signedOut = useRef(false);
  const answering = useRef(new Set<string>());
  // Callbacks read the latest values without being rebuilt on every change.
  const itemsRef = useRef(items);
  const countRef = useRef(count);
  useEffect(() => {
    itemsRef.current = items;
    countRef.current = count;
  }, [items, count]);

  const refreshCount = useCallback(async (): Promise<boolean> => {
    if (signedOut.current) return true;
    lastCountAt.current = Date.now();
    const id = ++countRequest.current;
    const result = await read<UnreadCount>("/api/notifications/unread-count");
    if (id !== countRequest.current) return true;
    if (result.ok) {
      setCount(result.value.count);
      return true;
    }
    // The session ended: stop asking, show no badge.
    if (result.code === "UNAUTHENTICATED") {
      signedOut.current = true;
      setCount(null);
      return true;
    }
    return false;
  }, []);

  const refreshIfDue = useCallback(() => {
    if (Date.now() - lastCountAt.current >= MIN_GAP_MS) void refreshCount();
  }, [refreshCount]);

  // Mount and every navigation.
  useEffect(() => {
    void refreshCount();
  }, [pathname, refreshCount]);

  // Focus, and the tab becoming visible again.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshIfDue();
    };
    window.addEventListener("focus", refreshIfDue);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refreshIfDue);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshIfDue]);

  // The poll: only while visible; backs off after three failures in a row.
  useEffect(() => {
    if (pollMs <= 0) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let stopped = false;

    const delay = () =>
      failures < 3 ? pollMs : Math.min(pollMs * 2 ** (failures - 2), MAX_BACKOFF_MS);
    const clear = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      clear();
      if (stopped || document.visibilityState !== "visible") return;
      timer = setTimeout(tick, delay());
    };
    const tick = async () => {
      const ok = await refreshCount();
      failures = ok ? 0 : failures + 1;
      schedule();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        failures = 0;
        schedule();
      } else clear();
    };

    document.addEventListener("visibilitychange", onVisibility);
    schedule();
    return () => {
      stopped = true;
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pollMs, refreshCount]);

  const loadList = useCallback(async () => {
    const id = ++listRequest.current;
    setListState("loading");
    setListError(null);
    setMoreFailed(false);
    setFailedIds(new Set());
    setMarkAllFailed(false);
    const result = await read<NotificationPage>(`/api/notifications?limit=${PAGE_SIZE}`);
    if (id !== listRequest.current) return;
    if (result.ok) {
      setItems(result.value.items);
      setCursor(result.value.nextCursor);
      setListState("ready");
      void refreshCount();
    } else {
      setListError(result.code);
      setListState("error");
    }
  }, [refreshCount]);

  const loadMore = useCallback(async () => {
    if (cursor === null || loadingMore) return;
    const id = listRequest.current;
    setLoadingMore(true);
    setMoreFailed(false);
    const result = await read<NotificationPage>(
      `/api/notifications?limit=${PAGE_SIZE}&cursor=${encodeURIComponent(cursor)}`,
    );
    setLoadingMore(false);
    // A reload while this was in flight made the page stale.
    if (id !== listRequest.current) return;
    if (result.ok) {
      setItems((current) => {
        const seen = new Set(current.map((n) => n.id));
        return [...current, ...result.value.items.filter((n) => !seen.has(n.id))];
      });
      setCursor(result.value.nextCursor);
    } else setMoreFailed(true);
  }, [cursor, loadingMore]);

  const markRead = useCallback(async (id: string) => {
    const target = itemsRef.current.find((n) => n.id === id);
    if (!target || target.read) return;
    // Optimistic: the badge and the dot change at once; a failure puts them back.
    setItems((c) => withRead(c, new Set([id]), true));
    setCount((c) => (c === null ? c : Math.max(0, c - 1)));
    setFailedIds((f) => {
      const next = new Set(f);
      next.delete(id);
      return next;
    });
    const result = await markNotificationReadAction(id);
    if (result.ok) return;
    setItems((c) => withRead(c, new Set([id]), false));
    setCount((c) => (c === null ? c : c + 1));
    setFailedIds((f) => new Set(f).add(id));
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = new Set(itemsRef.current.filter((n) => !n.read).map((n) => n.id));
    const before = countRef.current;
    setMarkAllFailed(false);
    setItems((c) => withRead(c, "all", true));
    setCount(0);
    const result = await markAllNotificationsReadAction();
    if (result.ok) return;
    setItems((c) => withRead(c, unread, false));
    setCount(before);
    setMarkAllFailed(true);
  }, []);

  const respond = useCallback(
    async (id: string, decision: "accept" | "reject") => {
      const target = itemsRef.current.find((n) => n.id === id);
      // Only an invitation that is still pending can be answered; a double click is one call.
      if (!target || !target.params || target.invite?.status !== "pending") return;
      // A double click is one call: the guard is a ref (synchronous), the state only drives the UI.
      if (answering.current.has(id)) return;
      answering.current.add(id);
      setRespondingIds(new Set(answering.current));
      setFailedIds((f) => {
        const next = new Set(f);
        next.delete(id);
        return next;
      });
      const result = await respondToInviteAction(target.params.projectId, decision);
      answering.current.delete(id);
      setRespondingIds(new Set(answering.current));
      // The answer is about the project, not the row: a second pending invitation row for the
      // same project (an invite sent again) is answered by it too, and must not keep its buttons.
      const rows = itemsRef.current.filter(
        (n) =>
          n.id === id ||
          (n.type === "team_invite" &&
            n.invite?.status === "pending" &&
            n.params?.projectId === target.params?.projectId),
      );
      const ids = new Set(rows.map((n) => n.id));
      const show = (status: "accepted" | "rejected" | "gone") =>
        setItems((c) =>
          c.map((n) => (ids.has(n.id) ? { ...n, read: true, invite: { status } } : n)),
        );
      if (result.ok) {
        show(decision === "accept" ? "accepted" : "rejected");
        const unread = rows.filter((n) => !n.read).length;
        if (unread > 0) setCount((c) => (c === null ? c : Math.max(0, c - unread)));
        // The API may or may not mark the notification read itself; asking again is harmless.
        for (const row of rows) void markNotificationReadAction(row.id);
        // Pages that list the user's projects now differ.
        router.refresh();
      } else if (result.code === "NOT_FOUND") {
        show("gone");
      } else if (result.code === "INVITE_NOT_PENDING") {
        // Answered elsewhere (another tab): learn the real state from the server.
        void loadList();
      } else {
        setFailedIds((f) => new Set(f).add(id));
      }
    },
    [loadList, router],
  );

  const value = useMemo<NotificationsValue>(
    () => ({
      count,
      items,
      hasMore: cursor !== null,
      listState,
      listError,
      loadingMore,
      moreFailed,
      failedIds,
      markAllFailed,
      respondingIds,
      loadList,
      loadMore,
      markRead,
      markAllRead,
      respond,
    }),
    [
      count,
      items,
      cursor,
      listState,
      listError,
      loadingMore,
      moreFailed,
      failedIds,
      markAllFailed,
      respondingIds,
      loadList,
      loadMore,
      markRead,
      markAllRead,
      respond,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};
