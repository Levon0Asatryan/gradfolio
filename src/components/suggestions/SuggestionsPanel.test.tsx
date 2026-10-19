import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import type { SuggestionItem } from "@/lib/api/types";

const mocks = vi.hoisted(() => ({
  accept: vi.fn(),
  dismiss: vi.fn(),
  refresh: vi.fn(),
  routerRefresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.routerRefresh }),
  usePathname: () => "/integrations",
}));
vi.mock("@/lib/integrations/suggestionActions", () => ({
  acceptOneSuggestionAction: mocks.accept,
  dismissSuggestionAction: mocks.dismiss,
  refreshInboxAction: mocks.refresh,
}));

const { SuggestionsProvider } = await import("./SuggestionsProvider");
const { SuggestionsPanel } = await import("./SuggestionsPanel");
const { SuggestionsInbox } = await import("./SuggestionsInbox");
const { NavCount } = await import("@/components/navigation/NavCount");

const base = {
  source: "github",
  status: "open",
  field: null,
  current: null,
  proposed: null,
  mode: null,
  skill: null,
  evidence: null,
  repository: null,
  project: null,
  lastSyncedAt: null,
  createdAt: "2026-10-16T10:00:00.000Z",
  resolvedAt: null,
} as const;
const id = (n: number) => `0b6f2c1e-1111-4222-8333-4444555566${String(n).padStart(2, "0")}`;
const skill = (n: number, name: string): SuggestionItem => ({
  ...base,
  id: id(n),
  kind: "skill.add",
  skill: name,
  evidence: { total: 3, repositories: 2, projects: 1 },
});
const link = (n: number): SuggestionItem => ({
  ...base,
  id: id(n),
  kind: "profile.links.twitter",
  field: "links.twitter",
  proposed: "https://x.com/ani_p",
  mode: "fill",
});
const education = (n: number): SuggestionItem => ({
  ...base,
  id: id(n),
  kind: "education.add",
  field: "education",
  proposed: "NPUA",
});
const update = (n: number): SuggestionItem => ({
  ...base,
  id: id(n),
  kind: "project.update",
  field: "summary",
  current: "Old summary",
  proposed: "New summary from GitHub",
  mode: "replace",
  project: { id: id(90), title: "Smart Garden" },
});

let open: SuggestionItem[];
const fetchMock = vi.fn();
function serve() {
  fetchMock.mockImplementation(async () =>
    open === null
      ? new Response(JSON.stringify({ code: "DATABASE_UNAVAILABLE" }), { status: 503 })
      : new Response(JSON.stringify({ items: open, more: false })),
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  open = [skill(1, "Go"), skill(2, "Rust"), link(3), education(4), update(5)];
  vi.stubGlobal("fetch", fetchMock);
  serve();
});
afterEach(() => vi.unstubAllGlobals());

const inbox = () =>
  renderInApp(
    <SuggestionsProvider pollMs={0}>
      <NavCount href="/integrations" />
      <SuggestionsInbox githubConnected />
    </SuggestionsProvider>,
  );

describe("the inbox", () => {
  it("groups by kind, shows now beside suggested, and applies nothing by itself", async () => {
    inbox();
    expect(await screen.findByRole("heading", { name: "Suggestions (5)" })).toBeInTheDocument();
    for (const group of [
      "Skills (2)",
      "Links (1)",
      "Projects (1)",
      "Education and experience (1)",
    ]) {
      expect(screen.getByRole("heading", { name: group })).toBeInTheDocument();
    }
    const card = screen.getByRole("heading", { name: /Smart Garden/ }).closest("li")!;
    expect(within(card).getByText("Old summary")).toBeInTheDocument();
    expect(within(card).getByText("New summary from GitHub")).toBeInTheDocument();
    // A fill is not pre-accepted anywhere: no call without a click.
    expect(mocks.accept).not.toHaveBeenCalled();
    expect(mocks.dismiss).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: /^Accept:/ })).toHaveLength(4);
    expect(screen.getByRole("button", { name: /^Fill in details:/ })).toBeInTheDocument();
  });

  it("shows a README change as plain text: no markup is drawn and nothing in it loads", async () => {
    open = [
      {
        ...update(5),
        field: "descriptionHtml",
        current: "<p>Old <b>text</b></p>",
        proposed:
          '<h1>New</h1><p>README <img src="x" onerror="window.__pwned=1"><script>window.__pwned=1</script></p>',
      },
    ];
    inbox();
    const card = (await screen.findByRole("heading", { name: /Smart Garden/ })).closest("li")!;
    expect(within(card).getByText("Old text")).toBeInTheDocument();
    expect(within(card).getByText(/^New README/)).toBeInTheDocument();
    expect(card.querySelector("img[src='x'], script, h1, b")).toBeNull();
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it("accepts a skill: one call for that id, the card goes, the count follows, it is announced", async () => {
    mocks.accept.mockResolvedValue({ ok: true, projectId: null });
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (5)" });
    expect(screen.getByTestId("nav-suggestions-count")).toHaveTextContent("5");

    fireEvent.click(screen.getByRole("button", { name: "Accept: Add the skill Go" }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Accept: Add the skill Go" })).toBeNull(),
    );
    expect(mocks.accept).toHaveBeenCalledTimes(1);
    expect(mocks.accept).toHaveBeenCalledWith({ id: id(1) });
    expect(screen.getByTestId("nav-suggestions-count")).toHaveTextContent("4");
    expect(screen.getByRole("status")).toHaveTextContent("Accepted: Add the skill Go");
    expect(mocks.routerRefresh).toHaveBeenCalled();
  });

  it("moves focus to the next card's heading after an answer, and to the panel heading after the last", async () => {
    open = [skill(1, "Go"), skill(2, "Rust")];
    mocks.dismiss.mockResolvedValue({ ok: true });
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (2)" });

    fireEvent.click(screen.getByRole("button", { name: "Dismiss: Add the skill Go" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Add the skill Rust" })).toHaveFocus(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss: Add the skill Rust" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Suggestions (0)" })).toHaveFocus(),
    );
    expect(screen.getByText("Nothing to suggest")).toBeInTheDocument();
    expect(screen.queryByTestId("nav-suggestions-count")).toBeNull();
  });

  it("dismisses a link with a call to dismiss only", async () => {
    mocks.dismiss.mockResolvedValue({ ok: true });
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (5)" });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss: X (Twitter) link" }));
    await waitFor(() => expect(mocks.dismiss).toHaveBeenCalledWith({ id: id(3) }));
    expect(mocks.accept).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "X (Twitter) link" })).toBeNull(),
    );
  });

  it("a second click while the call is out is no second call", async () => {
    let finish!: (v: unknown) => void;
    mocks.accept.mockReturnValue(new Promise((r) => (finish = r)));
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (5)" });
    const button = screen.getByRole("button", { name: "Accept: Add the skill Go" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.accept).toHaveBeenCalledTimes(1);
    // The button keeps focus and its place in the order while the call is out.
    expect(button).toHaveAttribute("aria-disabled", "true");
    finish({ ok: true, projectId: null });
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Add the skill Go/ })).toBeNull(),
    );
  });

  it("SUGGESTION_STALE: says it changed meanwhile, applies nothing, removes the card and reads again", async () => {
    mocks.accept.mockResolvedValue({ ok: false, code: "SUGGESTION_STALE" });
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (5)" });
    open = open.filter((i) => i.id !== id(3)); // the API superseded it
    const reads = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Accept: X (Twitter) link" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "X (Twitter) link: This changed in the meantime, so nothing was applied. The suggestion was removed.",
      ),
    );
    expect(screen.queryByRole("heading", { name: "X (Twitter) link" })).toBeNull();
    expect(screen.queryByText(/^Accepted/)).toBeNull();
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(reads));
    expect(mocks.routerRefresh).not.toHaveBeenCalled();
  });

  it("SUGGESTION_RESOLVED: says it was already answered and removes the card", async () => {
    mocks.dismiss.mockResolvedValue({ ok: false, code: "SUGGESTION_RESOLVED" });
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (5)" });
    open = open.filter((i) => i.id !== id(1)); // answered elsewhere: the API no longer lists it
    fireEvent.click(screen.getByRole("button", { name: "Dismiss: Add the skill Go" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("This suggestion was already answered"),
    );
    expect(screen.queryByRole("heading", { name: "Add the skill Go" })).toBeNull();
  });

  it("any other failure keeps the card and says why", async () => {
    mocks.accept.mockResolvedValue({ ok: false, code: "RATE_LIMITED" });
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (5)" });
    fireEvent.click(screen.getByRole("button", { name: "Accept: Add the skill Go" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Too many requests"));
    expect(screen.getByRole("heading", { name: "Add the skill Go" })).toBeInTheDocument();
    expect(screen.getByTestId("nav-suggestions-count")).toHaveTextContent("5");
  });

  it("an education entry needs the student's values first; nothing is sent until they are valid", async () => {
    mocks.accept.mockResolvedValue({ ok: true, projectId: null });
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (5)" });
    fireEvent.click(screen.getByRole("button", { name: /^Fill in details:/ }));
    expect(mocks.accept).not.toHaveBeenCalled();

    const form = screen.getByRole("form", { name: "Education details" });
    fireEvent.click(within(form).getByRole("button", { name: "Add to profile" }));
    expect(mocks.accept).not.toHaveBeenCalled();
    expect(within(form).getAllByText("Required").length).toBe(3);

    fireEvent.change(within(form).getByLabelText(/Degree/), { target: { value: "BSc" } });
    fireEvent.change(within(form).getByLabelText(/Field of study/), { target: { value: "CS" } });
    fireEvent.change(within(form).getByLabelText(/Start year/), { target: { value: "2022" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add to profile" }));
    await waitFor(() =>
      expect(mocks.accept).toHaveBeenCalledWith({
        id: id(4),
        overrides: { degree: "BSc", field: "CS", startYear: 2022 },
      }),
    );
  });

  it("the API's 400 on the form keeps the form open with the message", async () => {
    mocks.accept.mockResolvedValue({ ok: false, code: "VALIDATION_FAILED" });
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (5)" });
    fireEvent.click(screen.getByRole("button", { name: /^Fill in details:/ }));
    const form = screen.getByRole("form", { name: "Education details" });
    fireEvent.change(within(form).getByLabelText(/Degree/), { target: { value: "BSc" } });
    fireEvent.change(within(form).getByLabelText(/Field of study/), { target: { value: "CS" } });
    fireEvent.change(within(form).getByLabelText(/Start year/), { target: { value: "2022" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add to profile" }));
    expect(await within(form).findByRole("alert")).toHaveTextContent(
      "Some of the values are not valid",
    );
    expect(screen.getByRole("form", { name: "Education details" })).toBeInTheDocument();
  });

  it("shows loading, then an error with Retry that reads again, never 'Nothing to suggest'", async () => {
    open = null as unknown as SuggestionItem[];
    serve();
    inbox();
    expect(screen.getByText("Loading suggestions")).toBeInTheDocument();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Suggestions could not be loaded");
    expect(screen.queryByText("Nothing to suggest")).toBeNull();
    open = [skill(1, "Go")];
    serve();
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Add the skill Go" })).toBeInTheDocument();
  });

  it("shows 'Nothing to suggest' when the API has none", async () => {
    open = [];
    inbox();
    expect(await screen.findByText("Nothing to suggest")).toBeInTheDocument();
  });

  it("'Check GitHub now' says what the API said, throttled included, and reads the list again", async () => {
    mocks.refresh.mockResolvedValue({ ok: true, github: "throttled", created: 0 });
    inbox();
    await screen.findByRole("heading", { name: "Suggestions (5)" });
    const reads = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Check GitHub now" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("GitHub was read a moment ago"),
    );
    expect(fetchMock.mock.calls.length).toBeGreaterThan(reads);
  });
});

describe("the navigation count", () => {
  it("names the number in words after the item, caps at 99+, and is hidden at zero", async () => {
    open = Array.from({ length: 100 }, (_, n) => skill(n, `S${n}`));
    renderInApp(
      <SuggestionsProvider pollMs={0}>
        <a href="/integrations">
          Integrations
          <NavCount href="/integrations" />
        </a>
        <a href="/account">
          Account
          <NavCount href="/account" />
        </a>
      </SuggestionsProvider>,
    );
    const item = await screen.findByRole("link", { name: "Integrations 100 to review" });
    expect(within(item).getByTestId("nav-suggestions-count")).toHaveTextContent("99+");
    // Only the Integrations item carries it.
    expect(screen.getByRole("link", { name: "Account" })).toBeInTheDocument();
  });

  it("renders nothing at zero", async () => {
    open = [];
    renderInApp(
      <SuggestionsProvider pollMs={0}>
        <NavCount href="/integrations" />
      </SuggestionsProvider>,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByTestId("nav-suggestions-count")).toBeNull();
  });
});

describe("a strip", () => {
  it("lists only its own kind under 'Suggestions (N)', and hides when there are none", async () => {
    renderInApp(
      <SuggestionsProvider pollMs={0}>
        <SuggestionsPanel groups={["skills"]} variant="strip" />
      </SuggestionsProvider>,
    );
    expect(await screen.findByRole("heading", { name: "Suggestions (2)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add the skill Go" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /X \(Twitter\)/ })).toBeNull();
  });

  it("renders nothing while a kind has no suggestion", async () => {
    open = [link(3)];
    const { container } = renderInApp(
      <SuggestionsProvider pollMs={0}>
        <SuggestionsPanel groups={["skills"]} variant="strip" />
      </SuggestionsProvider>,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.querySelector("section")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
