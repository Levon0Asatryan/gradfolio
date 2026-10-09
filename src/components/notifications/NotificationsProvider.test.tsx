import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notification } from "./fixtures";
import { NotificationsProvider, POLL_MS, useNotifications } from "./NotificationsProvider";

const PATH = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => PATH.current,
  useRouter: () => ({ refresh: vi.fn() }),
}));
const actions = vi.hoisted(() => ({ one: vi.fn(), all: vi.fn(), respond: vi.fn() }));
vi.mock("@/lib/notifications/actions", () => ({
  markNotificationReadAction: actions.one,
  markAllNotificationsReadAction: actions.all,
  respondToInviteAction: actions.respond,
}));

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
const fail = (status: number, code: string) =>
  Promise.resolve(new Response(JSON.stringify({ code }), { status }));

let fetchMock: ReturnType<typeof vi.fn>;
const countCalls = () =>
  fetchMock.mock.calls.filter((c) => String(c[0]).endsWith("/unread-count")).length;

const Probe = () => {
  const n = useNotifications();
  return (
    <div>
      <output data-testid="count">{n.count === null ? "none" : n.count}</output>
      <output data-testid="state">{n.listState}</output>
      <output data-testid="more">{n.hasMore ? "more" : "end"}</output>
      <output data-testid="moreFailed">{String(n.moreFailed)}</output>
      <output data-testid="allFailed">{String(n.markAllFailed)}</output>
      <ul>
        {n.items.map((i) => (
          <li key={i.id} data-testid={`item-${i.id.slice(-2)}`}>
            {i.read ? "read" : "unread"}
            {n.failedIds.has(i.id) ? " failed" : ""}
          </li>
        ))}
      </ul>
      <button onClick={() => void n.loadList()}>load</button>
      <button onClick={() => void n.loadMore()}>more</button>
      <button onClick={() => void n.markRead(n.items[0]?.id ?? "")}>mark-first</button>
      <button onClick={() => void n.markAllRead()}>mark-all</button>
    </div>
  );
};

const mount = (pollMs?: number) =>
  render(
    <NotificationsProvider pollMs={pollMs}>
      <Probe />
    </NotificationsProvider>,
  );
const count = () => screen.getByTestId("count").textContent;
const flush = () => act(async () => {});

const setVisibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
};

beforeEach(() => {
  PATH.current = "/";
  vi.useFakeTimers({ shouldAdvanceTime: false });
  setVisibility("visible");
  fetchMock = vi.fn((url: string) =>
    String(url).endsWith("/unread-count") ? ok({ count: 3 }) : ok({ items: [], nextCursor: null }),
  );
  vi.stubGlobal("fetch", fetchMock);
  actions.one.mockResolvedValue({ ok: true });
  actions.all.mockResolvedValue({ ok: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("the unread count", () => {
  it("is read on mount through the same-origin route, never the API", async () => {
    mount();
    await flush();
    expect(count()).toBe("3");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/notifications/unread-count");
  });

  it("shows no count (not 0) when the first read fails", async () => {
    fetchMock.mockImplementation(() => fail(503, "API_UNREACHABLE"));
    mount();
    await flush();
    expect(count()).toBe("none");
  });

  it("is polled every 60 s while the tab is visible", async () => {
    mount();
    await flush();
    expect(countCalls()).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS));
    expect(countCalls()).toBe(2);
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS));
    expect(countCalls()).toBe(3);
  });

  it("stops polling while hidden and reads again when the tab comes back", async () => {
    mount();
    await flush();
    act(() => setVisibility("hidden"));
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS * 3));
    expect(countCalls()).toBe(1);
    act(() => setVisibility("visible"));
    await flush();
    expect(countCalls()).toBe(2);
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS));
    expect(countCalls()).toBe(3);
  });

  it("does not start polling in a tab that is hidden when the page loads", async () => {
    setVisibility("hidden");
    mount();
    await flush();
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS * 3));
    expect(countCalls()).toBe(1); // the mount read only
  });

  it("is read again on navigation and on focus (not twice within 2 s)", async () => {
    const view = mount();
    await flush();
    PATH.current = "/projects";
    view.rerender(
      <NotificationsProvider>
        <Probe />
      </NotificationsProvider>,
    );
    await flush();
    expect(countCalls()).toBe(2);
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await flush();
    expect(countCalls()).toBe(2); // within 2 s of the navigation read
    await act(() => vi.advanceTimersByTimeAsync(2500));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await flush();
    expect(countCalls()).toBe(3);
  });

  it("keeps the last value on a failed poll, backs off after three failures, and recovers", async () => {
    mount();
    await flush();
    fetchMock.mockImplementation(() => fail(503, "API_UNREACHABLE"));
    for (let i = 0; i < 3; i++) await act(() => vi.advanceTimersByTimeAsync(POLL_MS));
    expect(count()).toBe("3");
    const afterThree = countCalls();
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS)); // doubled: not due yet
    expect(countCalls()).toBe(afterThree);
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS));
    expect(countCalls()).toBe(afterThree + 1);
  });

  it("stops asking once the session is gone", async () => {
    fetchMock.mockImplementation(() => fail(401, "UNAUTHENTICATED"));
    mount();
    await flush();
    expect(count()).toBe("none");
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS * 3));
    expect(countCalls()).toBe(1);
  });

  it("clears its timer on unmount", async () => {
    const view = mount();
    await flush();
    view.unmount();
    await vi.advanceTimersByTimeAsync(POLL_MS * 3);
    expect(countCalls()).toBe(1);
  });
});

describe("the list", () => {
  const A = notification({ id: "0b6f2c1e-1111-4222-8333-4444555566a1" });
  const B = notification({ id: "0b6f2c1e-1111-4222-8333-4444555566b2", read: true });

  const withList = (page: unknown) =>
    fetchMock.mockImplementation((url: string) =>
      String(url).endsWith("/unread-count") ? ok({ count: 1 }) : ok(page),
    );

  it("loads on demand, and a later answer wins over an older one arriving late", async () => {
    const resolvers: Array<(r: Response) => void> = [];
    fetchMock.mockImplementation((url: string) =>
      String(url).endsWith("/unread-count")
        ? ok({ count: 1 })
        : new Promise<Response>((r) => resolvers.push(r)),
    );
    mount();
    await flush();
    fireEvent.click(screen.getByText("load"));
    fireEvent.click(screen.getByText("load"));
    await act(async () => {
      resolvers[1]?.(new Response(JSON.stringify({ items: [A], nextCursor: null })));
    });
    await act(async () => {
      resolvers[0]?.(new Response(JSON.stringify({ items: [A, B], nextCursor: null })));
    });
    expect(screen.getAllByTestId(/item-/)).toHaveLength(1);
  });

  it("follows the cursor and does not duplicate a row", async () => {
    withList({ items: [A], nextCursor: "c1" });
    mount();
    await flush();
    fireEvent.click(screen.getByText("load"));
    await flush();
    expect(screen.getByTestId("more").textContent).toBe("more");
    withList({ items: [A, B], nextCursor: null });
    fireEvent.click(screen.getByRole("button", { name: "more" }));
    await flush();
    expect(screen.getAllByTestId(/item-/)).toHaveLength(2);
    const last = String(fetchMock.mock.calls.at(-1)?.[0]);
    expect(last).toContain("cursor=c1");
  });

  it("keeps the list when Load more fails and says so", async () => {
    withList({ items: [A], nextCursor: "c1" });
    mount();
    await flush();
    fireEvent.click(screen.getByText("load"));
    await flush();
    fetchMock.mockImplementation(() => fail(500, "UNKNOWN_ERROR"));
    fireEvent.click(screen.getByRole("button", { name: "more" }));
    await flush();
    expect(screen.getByTestId("state").textContent).toBe("ready");
    expect(screen.getByTestId("moreFailed").textContent).toBe("true");
    expect(screen.getAllByTestId(/item-/)).toHaveLength(1);
  });

  it("goes to the error state when the first read fails", async () => {
    fetchMock.mockImplementation(() => fail(503, "API_UNREACHABLE"));
    mount();
    await flush();
    fireEvent.click(screen.getByText("load"));
    await flush();
    expect(screen.getByTestId("state").textContent).toBe("error");
  });

  it("marks one read at once, and puts it back when the call fails", async () => {
    withList({ items: [A], nextCursor: null });
    mount();
    await flush();
    fireEvent.click(screen.getByText("load"));
    await flush();
    expect(count()).toBe("1");
    let finish: (v: unknown) => void = () => {};
    actions.one.mockReturnValue(new Promise((r) => (finish = r)));
    fireEvent.click(screen.getByText("mark-first"));
    await flush();
    expect(count()).toBe("0");
    expect(screen.getByTestId("item-a1").textContent).toBe("read");
    await act(async () => finish({ ok: false, code: "UNKNOWN_ERROR" }));
    expect(count()).toBe("1");
    expect(screen.getByTestId("item-a1").textContent).toBe("unread failed");
  });

  it("does not call the API to mark a row that is already read", async () => {
    withList({ items: [B], nextCursor: null });
    mount();
    await flush();
    fireEvent.click(screen.getByText("load"));
    await flush();
    fireEvent.click(screen.getByText("mark-first"));
    await flush();
    expect(actions.one).not.toHaveBeenCalled();
  });

  it("marks all read, and restores the rows and the count when it fails", async () => {
    withList({ items: [A, B], nextCursor: null });
    mount();
    await flush();
    fireEvent.click(screen.getByText("load"));
    await flush();
    actions.all.mockResolvedValue({ ok: false, code: "RATE_LIMITED" });
    fireEvent.click(screen.getByText("mark-all"));
    await flush();
    expect(count()).toBe("1");
    expect(screen.getByTestId("item-a1").textContent).toBe("unread");
    expect(screen.getByTestId("allFailed").textContent).toBe("true");
    actions.all.mockResolvedValue({ ok: true });
    fireEvent.click(screen.getByText("mark-all"));
    await flush();
    expect(count()).toBe("0");
    expect(screen.getByTestId("item-a1").textContent).toBe("read");
    expect(screen.getByTestId("allFailed").textContent).toBe("false");
    expect(actions.all).toHaveBeenCalledTimes(2);
  });
});
