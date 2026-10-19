import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import type { SuggestionItem } from "@/lib/api/types";
import { PROFILE } from "@/testing/fixtures";

const mocks = vi.hoisted(() => ({ accept: vi.fn(), dismiss: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: vi.fn() }),
  usePathname: () => "/profile/x",
}));
vi.mock("@/lib/integrations/suggestionActions", () => ({
  acceptOneSuggestionAction: mocks.accept,
  dismissSuggestionAction: mocks.dismiss,
}));
vi.mock("@/lib/uploads/actions", () => ({ signUploadAction: vi.fn() }));
vi.mock("@/lib/uploads/putFile", () => ({ putFile: vi.fn() }));
vi.mock("@/lib/profile/actions", () => ({
  updateProfileAction: vi.fn(),
  saveEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
  reorderEntriesAction: vi.fn(),
  replaceSkillsAction: vi.fn(),
}));

const { ProfileView } = await import("./ProfileView");
const { SkillsEditor } = await import("./edit/SkillsEditor");
const { SuggestionsProvider } = await import("@/components/suggestions/SuggestionsProvider");
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
const skill = (n: number, name: string): SuggestionItem => ({
  ...base,
  id: `0b6f2c1e-1111-4222-8333-4444555566${String(n).padStart(2, "0")}`,
  kind: "skill.add",
  skill: name,
  evidence: { total: 2, repositories: 2, projects: 0 },
});
const twitter: SuggestionItem = {
  ...base,
  id: "0b6f2c1e-1111-4222-8333-444455556670",
  kind: "profile.links.twitter",
  field: "links.twitter",
  proposed: "https://x.com/ani_p",
  mode: "fill",
};

let open: SuggestionItem[];
beforeEach(() => {
  vi.resetAllMocks();
  open = [skill(1, "Rust"), twitter];
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ items: open, more: false }))),
  );
});
afterEach(() => vi.unstubAllGlobals());

const tree = (ui: React.ReactNode) => (
  <ThemeWrapper>
    <LanguageProvider>
      <SuggestionsProvider pollMs={0}>
        <NavCount href="/integrations" />
        {ui}
      </SuggestionsProvider>
    </LanguageProvider>
  </ThemeWrapper>
);
const wrap = (ui: React.ReactNode) => render(tree(ui));

describe("the strips on the profile", () => {
  it("the Skills strip lists only skills, the Links strip only links", async () => {
    wrap(<ProfileView profile={{ ...PROFILE, isOwner: true }} />);
    expect(await screen.findAllByRole("heading", { name: "Suggestions (1)" })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Add the skill Rust" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "X (Twitter) link" })).toBeInTheDocument();
  });

  it("accepting on the Skills strip adds the skill to the section and lowers the count", async () => {
    mocks.accept.mockResolvedValue({ ok: true, projectId: null });
    wrap(<ProfileView profile={{ ...PROFILE, isOwner: true, skills: ["TypeScript"] }} />);
    await screen.findByRole("heading", { name: "Add the skill Rust" });
    expect(screen.getByTestId("nav-suggestions-count")).toHaveTextContent("2");
    expect(screen.queryByText("Rust")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Accept: Add the skill Rust" }));

    // The chip is in the section at once, before the page has been read again.
    expect(await screen.findByText("Rust")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("nav-suggestions-count")).toHaveTextContent("1"));
    expect(mocks.accept).toHaveBeenCalledWith({ id: skill(1, "Rust").id });
    expect(mocks.refresh).toHaveBeenCalled();
    // The Links strip is untouched.
    expect(screen.getByRole("heading", { name: "X (Twitter) link" })).toBeInTheDocument();
  });

  it("accepting on the Links strip calls accept for the link, keeps the skills strip, and reads the page again", async () => {
    mocks.accept.mockResolvedValue({ ok: true, projectId: null });
    wrap(<ProfileView profile={{ ...PROFILE, isOwner: true }} />);
    await screen.findByRole("heading", { name: "X (Twitter) link" });
    fireEvent.click(screen.getByRole("button", { name: "Accept: X (Twitter) link" }));
    await waitFor(() => expect(mocks.accept).toHaveBeenCalledWith({ id: twitter.id }));
    await waitFor(() => expect(screen.getByTestId("nav-suggestions-count")).toHaveTextContent("1"));
    expect(mocks.refresh).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Add the skill Rust" })).toBeInTheDocument();
  });

  it("shows no strip to a visitor's view of a profile that is not theirs", async () => {
    wrap(<ProfileView profile={{ ...PROFILE, isOwner: false }} />);
    await screen.findByRole("heading", { name: PROFILE.name });
    expect(screen.queryByRole("heading", { name: /^Suggestions/ })).toBeNull();
  });
});

describe("SkillsEditor when the page is read again", () => {
  it("keeps what the student has typed, and a skill accepted meanwhile survives the Save", async () => {
    const view = wrap(<SkillsEditor skills={["TypeScript"]} />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit skills" }));
    fireEvent.change(screen.getByLabelText("New Skill"), { target: { value: "Go" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    // The server now holds one more skill (accepted elsewhere).
    view.rerender(tree(<SkillsEditor skills={["TypeScript", "Rust"]} />));
    const form = screen.getByRole("button", { name: "Save skills" }).closest("div")!.parentElement!;
    expect(within(form).getByText("Go")).toBeInTheDocument();
    expect(within(form).getByText("Rust")).toBeInTheDocument();
    expect(within(form).getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save skills" })).toBeEnabled();
  });
});
