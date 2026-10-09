import { describe, expect, it, vi } from "vitest";
import { am } from "@/data/locales/am";
import { en } from "@/data/locales/en";
import { ru } from "@/data/locales/ru";
vi.mock("@/lib/notifications/actions", () => ({
  markNotificationReadAction: vi.fn(),
  markAllNotificationsReadAction: vi.fn(),
  respondToInviteAction: vi.fn(),
}));

import { notification } from "./fixtures";
import { notificationText } from "./NotificationItem";

const params = (role: string | null = null) => ({
  actorId: null,
  actorName: "Ani",
  projectId: "p",
  projectTitle: "Campus",
  role,
});

describe.each([
  ["en", en, "Ani joined Campus"],
  ["ru", ru, "Ani теперь в команде проекта «Campus»"],
  ["am", am, "Ani-ը միացավ «Campus» նախագծին"],
] as const)("notificationText in %s", (_lang, t, accepted) => {
  it("renders every team type from its params", () => {
    expect(notificationText(notification({ type: "team_accepted", params: params() }), t)).toBe(
      accepted,
    );
    for (const type of ["team_invite", "team_rejected", "team_left"] as const) {
      const text = notificationText(notification({ type, params: params() }), t);
      expect(text).toContain("Ani");
      expect(text).toContain("Campus");
      expect(text).not.toMatch(/[{}]/);
    }
  });

  it("names the role in an invite that has one, and only then", () => {
    const withRole = notificationText(
      notification({ type: "team_invite", params: params("Designer") }),
      t,
    );
    expect(withRole).toContain("Designer");
    expect(
      notificationText(notification({ type: "team_invite", params: params() }), t),
    ).not.toContain("Designer");
  });
});

describe("notificationText fallbacks", () => {
  it("shows the API's title for a row written before params existed", () => {
    expect(notificationText(notification({ params: null, title: "Old text" }), en)).toBe(
      "Old text",
    );
  });

  it("shows the title for a type the app does not know", () => {
    expect(
      notificationText(notification({ type: "general", params: params(), title: "Heads up" }), en),
    ).toBe("Heads up");
    expect(
      notificationText(
        notification({ type: "from_the_future" as never, params: params(), title: "Newer" }),
        ru,
      ),
    ).toBe("Newer");
  });
});
