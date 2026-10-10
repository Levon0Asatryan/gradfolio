import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { IncomingRow, OutgoingRow } from "./InviteLists";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/notifications/actions", () => ({ respondToInviteAction: vi.fn() }));
vi.mock("@/lib/team/actions", () => ({ removeMemberAction: vi.fn() }));

const incoming = {
  id: "m1",
  project: { id: "p1", title: "Smart Campus" },
  role: "Designer",
  invitedAt: "2026-10-09T12:00:00.000Z",
  invitedBy: { id: "u-owner", name: "Owen" },
};
const outgoing = {
  id: "m2",
  project: { id: "p1", title: "Smart Campus" },
  invitee: { id: "u-ben", name: "Ben", avatarUrl: null },
  role: null,
  invitedAt: "2026-10-09T12:00:00.000Z",
};
const app = (ui: React.ReactElement) => (
  <ThemeWrapper initialMode="light">
    <LanguageProvider initialLanguage="am">{ui}</LanguageProvider>
  </ThemeWrapper>
);

afterEach(() => vi.restoreAllMocks());

describe("invite dates and hydration", () => {
  // A browser without Armenian ICU data prints the English month; Node on the server does not.
  it.each([
    ["incoming", <IncomingRow key="i" invite={incoming} onDone={() => {}} />],
    ["outgoing", <OutgoingRow key="o" invite={outgoing} onDone={() => {}} />],
  ])("hydrates the %s row when the browser formats the date differently", async (_n, row) => {
    const html = renderToString(app(<ul>{row}</ul>));
    expect(html).toContain("2026");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    vi.spyOn(Date.prototype, "toLocaleDateString").mockReturnValue("Oct 9, 2026");
    const problems: unknown[] = [];
    await act(async () => {
      hydrateRoot(container, app(<ul>{row}</ul>), { onRecoverableError: (e) => problems.push(e) });
    });
    expect(problems).toEqual([]);
    container.remove();
  });
});
