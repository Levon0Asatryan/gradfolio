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
  }, 20_000);

  it("prevents an empty section/project selection", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Download resume" }));
    const dialog = within(screen.getByRole("dialog"));
    for (const name of ["About", "Education", "Experience", "Projects", "Skills", "Certifications"])
      fireEvent.click(dialog.getByRole("switch", { name }));
    expect(dialog.getByRole("button", { name: "Download resume" })).toBeDisabled();
    fireEvent.click(dialog.getByRole("switch", { name: "Projects" }));
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
      dialog.getByRole("switch", { name: "Public contact details and links" }),
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
  const send = async (dialog: ReturnType<typeof within>) => {
    const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 429 }));
    vi.stubGlobal("fetch", fetcher);
    fireEvent.click(dialog.getByRole("button", { name: "Download resume" }));
    await screen.findByText(/Too many downloads/);
    return JSON.parse(fetcher.mock.calls[0]![1].body) as {
      sections: string[];
      projectIds: string[];
    };
  };
  const open = () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Download resume" }));
    return within(screen.getByRole("dialog"));
  };

  it("sends sections in the order the user arranged them", async () => {
    const dialog = open();
    fireEvent.click(dialog.getByRole("button", { name: "Move up: Skills" }));
    fireEvent.click(dialog.getByRole("switch", { name: "Public contact details and links" }));
    const body = await send(dialog);
    expect(body.sections).toEqual([
      "contact",
      "bio",
      "education",
      "experience",
      "skills",
      "projects",
      "certifications",
    ]);
  });

  it("moves a block past blocks that are off, which keep their place", async () => {
    const dialog = open();
    fireEvent.click(dialog.getByRole("switch", { name: "Education" }));
    fireEvent.click(dialog.getByRole("button", { name: "Move down: About" }));
    const body = await send(dialog);
    expect(body.sections).toEqual(["experience", "bio", "projects", "skills", "certifications"]);
  });

  it("disables the move buttons at either end of the blocks that are on", () => {
    const dialog = open();
    expect(dialog.getByRole("button", { name: "Move up: About" })).toBeDisabled();
    expect(dialog.getByRole("button", { name: "Move down: About" })).toBeEnabled();
    expect(dialog.getByRole("button", { name: "Move down: Certifications" })).toBeDisabled();
    fireEvent.click(dialog.getByRole("switch", { name: "Certifications" }));
    expect(dialog.getByRole("button", { name: "Move down: Skills" })).toBeDisabled();
    expect(dialog.queryByRole("button", { name: "Move up: Certifications" })).toBeNull();
  });

  it("announces a move to screen readers", () => {
    const dialog = open();
    fireEvent.click(dialog.getByRole("button", { name: "Move up: Skills" }));
    expect(dialog.getByRole("status")).toHaveTextContent("Skills moved to position 4 of 6");
  });

  it("sends projects in the order the user arranged them", async () => {
    const dialog = open();
    fireEvent.click(dialog.getByRole("checkbox", { name: "Allow my private and draft projects" }));
    fireEvent.click(dialog.getByRole("checkbox", { name: "Private project" }));
    expect(dialog.getByRole("button", { name: "Move up: Public project" })).toBeDisabled();
    fireEvent.click(dialog.getByRole("button", { name: "Move up: Private project" }));
    expect(dialog.getByRole("status")).toHaveTextContent(
      "Private project moved to position 1 of 2",
    );
    const body = await send(dialog);
    expect(body.projectIds).toEqual([privateId, publicId]);
  });

  it("drops private projects from the selection when private is turned off again", async () => {
    const dialog = open();
    fireEvent.click(dialog.getByRole("checkbox", { name: "Allow my private and draft projects" }));
    fireEvent.click(dialog.getByRole("checkbox", { name: "Private project" }));
    fireEvent.click(dialog.getByRole("checkbox", { name: "Allow my private and draft projects" }));
    expect(dialog.queryByRole("alert")).toBeNull();
    expect(dialog.getByRole("checkbox", { name: "Private project" })).not.toBeChecked();
    expect((await send(dialog)).projectIds).toEqual([publicId]);
  });

  it("lists projects that are not picked apart from the ones that will be printed", () => {
    const dialog = open();
    fireEvent.click(dialog.getByRole("checkbox", { name: "Public project" }));
    expect(dialog.getByText("Not included")).toBeInTheDocument();
    expect(dialog.queryByRole("button", { name: "Move up: Public project" })).toBeNull();
  });
});
