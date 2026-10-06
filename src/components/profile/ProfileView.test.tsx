import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { PROFILE } from "@/testing/fixtures";
import { ProfileView } from "./ProfileView";

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
const action = vi.hoisted(() => ({ updateProfileAction: vi.fn() }));
vi.mock("@/lib/profile/actions", () => ({
  ...action,
  saveEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
  reorderEntriesAction: vi.fn(),
  replaceSkillsAction: vi.fn(),
}));

beforeEach(() => vi.resetAllMocks());

const show = (over: Partial<typeof PROFILE> = {}) =>
  render(
    <ThemeWrapper>
      <LanguageProvider>
        <ProfileView profile={{ ...PROFILE, ...over }} />
      </LanguageProvider>
    </ThemeWrapper>,
  );

describe("ProfileView", () => {
  it("shows the API's header, bio, links and sections", () => {
    show();
    expect(screen.getByRole("heading", { level: 1, name: "Ani Petrosyan" })).toBeInTheDocument();
    expect(screen.getByText("I like compilers.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/ani",
    );
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText(/B\.Sc\. • Informatics/)).toBeInTheDocument();
    expect(screen.getByText(/2021 – Present/)).toBeInTheDocument();
    expect(screen.getByText("Ecoroute")).toBeInTheDocument();
  });

  it("shows the real category, and marks draft and private projects", () => {
    show();
    expect(screen.getByText("Hackathon")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("never renders a javascript: credential URL", () => {
    show();
    expect(screen.queryByRole("link", { name: "Verify" })).not.toBeInTheDocument();
  });

  it("links the contact email from the profile, not the login email", () => {
    show();
    expect(screen.getByRole("link", { name: "Contact Ani Petrosyan" })).toHaveAttribute(
      "href",
      "mailto:ani%40example.com",
    );
  });

  it("shows empty sections as empty and nothing else", () => {
    show({
      education: [],
      experience: [],
      certifications: [],
      skills: [],
      projects: [],
      contactEmail: null,
      bio: null,
    });
    expect(screen.getByText("No education entries yet.")).toBeInTheDocument();
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Contact/ })).not.toBeInTheDocument();
  });

  it("tells the owner when nobody else can see the profile", () => {
    show({ isOwner: true, isPublic: false });
    expect(screen.getByText(/Only you can see this profile/)).toBeInTheDocument();
  });

  it("shows no private notice to a visitor", () => {
    show({ isOwner: false, isPublic: false });
    expect(screen.queryByText(/Only you can see this profile/)).not.toBeInTheDocument();
  });

  it("offers Add Project to the owner only", () => {
    const { unmount } = show({ isOwner: true });
    expect(screen.getByRole("button", { name: "Add Project" })).toBeInTheDocument();
    unmount();
    show({ isOwner: false });
    expect(screen.queryByRole("button", { name: "Add Project" })).not.toBeInTheDocument();
  });

  it("drops a non-http avatar URL instead of rendering it", () => {
    const { container } = show({ avatarUrl: "javascript:alert(1)" });
    expect(within(container).queryByRole("img")).not.toBeInTheDocument();
  });

  describe("editing the header", () => {
    const edit = () => {
      show({ isOwner: true });
      fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
    };

    it("offers Edit to the owner only", () => {
      show({ isOwner: false });
      expect(screen.queryByRole("button", { name: "Edit Profile" })).not.toBeInTheDocument();
    });

    it("closes the editor if the page stops being the owner's (e.g. after sign-out)", () => {
      const view = (isOwner: boolean) => (
        <ThemeWrapper>
          <LanguageProvider>
            <ProfileView profile={{ ...PROFILE, isOwner }} />
          </LanguageProvider>
        </ThemeWrapper>
      );
      const { rerender } = render(view(true));
      fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
      expect(screen.getByRole("form", { name: "Edit profile" })).toBeInTheDocument();
      rerender(view(false));
      expect(screen.queryByRole("form", { name: "Edit profile" })).not.toBeInTheDocument();
    });

    it("types the header fields for what they hold", () => {
      edit();
      const attr = (label: RegExp | string, name: string) =>
        screen.getByLabelText(label).getAttribute(name);
      expect(attr("Contact email", "type")).toBe("email");
      expect(attr("Contact email", "autocomplete")).toBe("email");
      expect(attr("Photo URL", "type")).toBe("url");
      for (const label of ["GitHub URL", "LinkedIn URL", "Twitter URL", "Website URL"]) {
        expect(attr(label, "type")).toBe("url");
        expect(attr(label, "autocomplete")).toBe("url");
      }
      expect(attr(/^Name/, "autocomplete")).toBe("name");
      expect(screen.getByLabelText(/^Name/)).toBeRequired();
    });

    it("counts the bio against the API's column, and refuses more", async () => {
      edit();
      expect(screen.getByText(/\/ 65535 bytes/)).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText("About you"), {
        target: { value: "€".repeat(21_846) },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(await screen.findByText("Too long: at most 65535 bytes.")).toBeInTheDocument();
      expect(action.updateProfileAction).not.toHaveBeenCalled();
    });

    it("saves through the action, closes, and refreshes the page data", async () => {
      action.updateProfileAction.mockResolvedValue({ ok: true });
      edit();
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Ani P." } });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
      expect(action.updateProfileAction).toHaveBeenCalledTimes(1);
      expect(action.updateProfileAction.mock.calls[0]?.[0]).toMatchObject({ name: "Ani P." });
      expect(screen.queryByRole("form", { name: "Edit profile" })).not.toBeInTheDocument();
    });

    it("keeps the form and the typed values when the save fails", async () => {
      action.updateProfileAction.mockResolvedValue({ ok: false, code: "DATABASE_UNAVAILABLE" });
      edit();
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Ani P." } });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Could not save your changes");
      expect(screen.getByLabelText(/^Name/)).toHaveValue("Ani P.");
      expect(nav.refresh).not.toHaveBeenCalled();
    });

    it("shows the server's field errors on the field", async () => {
      action.updateProfileAction.mockResolvedValue({
        ok: false,
        code: "VALIDATION_FAILED",
        fields: { "links.website": "invalid_url" },
      });
      edit();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(
        await screen.findByText("Enter a full http:// or https:// address."),
      ).toBeInTheDocument();
    });

    it("does not call the action for an empty name or a javascript: link", () => {
      edit();
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: " " } });
      fireEvent.change(screen.getByLabelText("Website URL"), {
        target: { value: "javascript:alert(1)" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(screen.getByText("This field is required.")).toBeInTheDocument();
      expect(screen.getByText("Enter a full http:// or https:// address.")).toBeInTheDocument();
      expect(action.updateProfileAction).not.toHaveBeenCalled();
    });

    it("cancel discards the edit without calling the API", () => {
      edit();
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Zed" } });
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.getByRole("heading", { level: 1, name: "Ani Petrosyan" })).toBeInTheDocument();
      expect(action.updateProfileAction).not.toHaveBeenCalled();
    });

    it("asks before an in-app link drops a dirty edit", () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      const link = document.createElement("a");
      link.href = "/projects";
      document.body.append(link);
      edit();
      const open = () => {
        const e = new MouseEvent("click", { bubbles: true, cancelable: true });
        link.dispatchEvent(e);
        return e;
      };
      open();
      expect(confirm).not.toHaveBeenCalled();
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Zed" } });
      expect(open().defaultPrevented).toBe(true);
      expect(confirm).toHaveBeenCalledTimes(1);
      link.remove();
      confirm.mockRestore();
    });

    it("warns before the tab closes while there are unsaved changes, and not otherwise", () => {
      edit();
      const clean = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(clean);
      expect(clean.defaultPrevented).toBe(false);
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Zed" } });
      const dirty = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(dirty);
      expect(dirty.defaultPrevented).toBe(true);
    });
  });

  describe("editing the sections (no global mode: each part has its own pencil and Add)", () => {
    it("shows no edit mode switch to anyone, and no edit controls to a visitor", () => {
      show({ isOwner: false });
      expect(
        screen.queryByRole("button", { name: /Edit Mode|Preview Mode/ }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Edit/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Add /i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Press the pencil/)).not.toBeInTheDocument();
    });

    it("gives the owner a pencil on every part from the start", () => {
      show({ isOwner: true });
      expect(
        screen.queryByRole("button", { name: /Edit Mode|Preview Mode/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit Profile" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit: B.Sc., NPUA" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add education" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit skills" })).toBeInTheDocument();
      expect(screen.getByText(/Press the pencil next to anything/)).toBeInTheDocument();
    });

    it("drops every editor if the page stops being the owner's", () => {
      const view = (isOwner: boolean) => (
        <ThemeWrapper>
          <LanguageProvider>
            <ProfileView profile={{ ...PROFILE, isOwner }} />
          </LanguageProvider>
        </ThemeWrapper>
      );
      const { rerender } = render(view(true));
      expect(screen.getByRole("button", { name: "Edit skills" })).toBeInTheDocument();
      rerender(view(false));
      expect(screen.queryByRole("button", { name: "Edit skills" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Add education" })).not.toBeInTheDocument();
    });

    it("hints at the next step and counts the completeness, and a full profile hides it", () => {
      show({ isOwner: true, headline: "", bio: null });
      expect(screen.getByText("Profile completeness")).toBeInTheDocument();
      expect(screen.getByText(/Next step: add a headline/)).toBeInTheDocument();
      expect(screen.getByRole("progressbar", { name: "Profile completeness" })).toBeInTheDocument();
      cleanup();
      show({
        isOwner: true,
        location: "Yerevan",
        avatarUrl: "https://example.com/a.png",
        skills: ["a", "b", "c"],
      });
      expect(screen.queryByText("Profile completeness")).not.toBeInTheDocument();
    });

    it("offers the empty header prompts to the owner only", () => {
      show({ isOwner: true, headline: "", bio: null });
      expect(screen.getByRole("button", { name: "Add a headline" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add a short bio" })).toBeInTheDocument();
      cleanup();
      show({ isOwner: false, headline: "", bio: null });
      expect(screen.queryByRole("button", { name: "Add a headline" })).not.toBeInTheDocument();
    });

    it("asks before a link drops an unsaved skill edit", () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      const link = document.createElement("a");
      link.href = "/projects";
      document.body.append(link);
      show({ isOwner: true });
      fireEvent.click(screen.getByRole("button", { name: "Edit skills" }));
      fireEvent.change(screen.getByLabelText("New Skill"), { target: { value: "Go" } });
      const e = new MouseEvent("click", { bubbles: true, cancelable: true });
      link.dispatchEvent(e);
      expect(e.defaultPrevented).toBe(true);
      link.remove();
      confirm.mockRestore();
    });
  });
});
