import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { PROFILE } from "@/testing/fixtures";
import { ResumeDownload } from "./ResumeDownload";

const publicId = "11111111-1111-4111-8111-111111111111";
const privateId = "22222222-2222-4222-8222-222222222222";
const profile = {
  ...PROFILE,
  isOwner: true,
  projects: [
    {
      ...PROFILE.projects[0]!,
      id: publicId,
      title: "Public project",
      isPublic: true,
      isDraft: false,
      role: "owner" as const,
    },
    {
      ...PROFILE.projects[0]!,
      id: privateId,
      title: "Private project",
      isPublic: false,
      isDraft: false,
      role: "owner" as const,
    },
  ],
};
const show = () =>
  render(
    <LanguageProvider>
      <ResumeDownload profile={profile} />
    </LanguageProvider>,
  );
beforeEach(() => {
  localStorage.clear();
  document.cookie = "language=; max-age=0; path=/";
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("resume download", () => {
  it("caps initial and subsequent project selection at fifty", async () => {
    const many = {
      ...profile,
      projects: Array.from({ length: 55 }, (_, i) => ({
        ...profile.projects[0]!,
        id: `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
        title: `Project ${i}`,
      })),
    };
    render(
      <LanguageProvider>
        <ResumeDownload profile={many} />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Download resume" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("checkbox", { name: "Project 50" })).toBeDisabled();
    fireEvent.click(dialog.getByRole("checkbox", { name: "Project 0" }));
    expect(dialog.getByRole("checkbox", { name: "Project 50" })).toBeEnabled();
    fireEvent.click(dialog.getByRole("checkbox", { name: "Project 50" }));
    expect(dialog.getByRole("checkbox", { name: "Project 51" })).toBeDisabled();
    const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 429 }));
    vi.stubGlobal("fetch", fetcher);
    fireEvent.click(dialog.getByRole("button", { name: "Download resume" }));
    await screen.findByText(/Too many downloads/);
    expect(JSON.parse(fetcher.mock.calls[0]![1].body).projectIds).toHaveLength(50);
  });

  it("prevents an empty section/project selection", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Download resume" }));
    const dialog = within(screen.getByRole("dialog"));
    for (const name of ["About", "Education", "Experience", "Projects", "Skills", "Certifications"])
      fireEvent.click(dialog.getByRole("checkbox", { name }));
    expect(dialog.getByRole("button", { name: "Download resume" })).toBeDisabled();
    fireEvent.click(dialog.getByRole("checkbox", { name: "Projects" }));
    fireEvent.click(dialog.getByRole("checkbox", { name: "Public project" }));
    expect(dialog.getByRole("button", { name: "Download resume" })).toBeDisabled();
  });

  it("explains that a selected project disappeared on a 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));
    show();
    fireEvent.click(screen.getByRole("button", { name: "Download resume" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Download resume" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Reload your profile");
  });
  it("defaults private projects and contact details off, and requires explicit private selection", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Download resume" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(
      dialog.getByRole("checkbox", { name: "Public contact details and links" }),
    ).not.toBeChecked();
    expect(dialog.getByRole("checkbox", { name: "Private project" })).toBeDisabled();
    fireEvent.click(dialog.getByRole("checkbox", { name: "Allow my private and draft projects" }));
    fireEvent.click(dialog.getByRole("checkbox", { name: "Private project" }));
    expect(dialog.getByRole("alert")).toHaveTextContent("visible to anyone");
    const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 429 }));
    vi.stubGlobal("fetch", fetcher);
    fireEvent.click(dialog.getByRole("button", { name: "Download resume" }));
    await screen.findByText(/Too many downloads/);
    const body = JSON.parse(fetcher.mock.calls[0]![1].body);
    expect(body).toMatchObject({ includePrivateProjects: true, projectIds: [publicId, privateId] });
    expect(dialog.getByRole("checkbox", { name: "Private project" })).toBeChecked();
  });

  it("downloads a PDF and sends only the selected project IDs", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response("%PDF-test", { headers: { "Content-Type": "application/pdf" } }),
      );
    vi.stubGlobal("fetch", fetcher);
    const objectUrl = vi.fn().mockReturnValue("blob:resume");
    URL.createObjectURL = objectUrl;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    show();
    fireEvent.click(screen.getByRole("button", { name: "Download resume" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Download resume" }),
    );
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(JSON.parse(fetcher.mock.calls[0]![1].body)).toMatchObject({
      projectIds: [publicId],
      includePrivateProjects: false,
    });
    expect(objectUrl).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
