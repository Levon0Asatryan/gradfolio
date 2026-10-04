import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { PROFILE } from "@/testing/fixtures";
import { ProfileView } from "./ProfileView";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const show = (over: Partial<typeof PROFILE> = {}) =>
  render(
    <LanguageProvider>
      <ProfileView profile={{ ...PROFILE, ...over }} />
    </LanguageProvider>,
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
});
