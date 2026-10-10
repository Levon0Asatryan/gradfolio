import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import ExperienceList from "@/components/profile/ExperienceList";
import ProjectMetadataCard from "@/components/project/ProjectMetadataCard";
import ProjectCard from "@/components/projects/ProjectCard";
import { projectSummary } from "@/testing/fixtures";

/**
 * The server's Node ships Armenian ICU data and a browser (Playwright's Chromium, some
 * Safari builds) may not, so the same date prints differently on the two sides (M5 #80, and
 * `/projects` in Armenian). Each dated element must keep the server's text without a mismatch.
 */
const app = (ui: React.ReactElement) => (
  <ThemeWrapper initialMode="light">
    <LanguageProvider initialLanguage="am">{ui}</LanguageProvider>
  </ThemeWrapper>
);

const experience = {
  id: "e1",
  title: "Intern",
  organization: "Acme",
  start: "2025-06",
  end: null,
  summary: "",
  achievements: [],
  skills: [],
};

const cases: Array<[string, React.ReactElement]> = [
  ["a project card", <ProjectCard key="c" project={projectSummary()} />],
  [
    "the project's timeline",
    <ProjectMetadataCard
      key="m"
      category="hackathon"
      metadata={{ startDate: "2025-12-06", endDate: null, course: null, professor: null }}
    />,
  ],
  [
    "an activity row",
    <ActivityFeed
      key="a"
      items={[
        {
          id: "a1",
          type: "project",
          translationKey: "projectCreated",
          translationParams: { title: "X" },
          timestamp: "2026-10-09T12:00:00.000Z",
        },
      ]}
    />,
  ],
  ["an experience row", <ExperienceList key="x" items={[experience]} />],
];

afterEach(() => vi.restoreAllMocks());

describe("dates and hydration", () => {
  it.each(cases)("hydrates %s when the browser formats the date differently", async (_n, node) => {
    const html = renderToString(app(node));
    expect(html).toMatch(/20\d\d/);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    // A browser without Armenian data prints the English month.
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function () {
      return { format: () => "Oct 9, 2026" };
    } as never);
    vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("Jun 2025");
    const problems: unknown[] = [];
    await act(async () => {
      hydrateRoot(container, app(node), { onRecoverableError: (e) => problems.push(e) });
    });
    expect(problems).toEqual([]);
    container.remove();
  });
});
