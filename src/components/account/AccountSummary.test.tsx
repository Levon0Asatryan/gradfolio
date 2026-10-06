import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { AccountSummary, type AccountResult } from "./AccountSummary";

const ME = {
  id: "0b6f2c1e-1111-4222-8333-444455556666",
  name: "Ani Petrosyan",
  email: "ani@example.com",
  avatarUrl: null,
  headline: "",
  verified: true,
  isPublic: true,
  onboarded: true,
  identities: ["google-oauth2"],
};

const show = (result: AccountResult) =>
  render(
    <LanguageProvider>
      <AccountSummary result={result} />
    </LanguageProvider>,
  );

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/profile/actions", () => ({ updateProfileAction: vi.fn() }));

const SETTINGS = { isPublic: true, contactEmail: null };

describe("AccountSummary", () => {
  it("shows the account the API returned", () => {
    show({ me: ME, settings: SETTINGS });
    expect(screen.getByRole("heading", { name: "My Account" })).toBeInTheDocument();
    expect(screen.getByText("Ani Petrosyan")).toBeInTheDocument();
    expect(screen.getByText("ani@example.com")).toBeInTheDocument();
    expect(screen.getByText("Email verified")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Linked accounts" })).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.queryByText("google-oauth2")).not.toBeInTheDocument();
  });

  it("names the email-and-password login in words and shows a generic label for unknown connections", () => {
    show({ me: { ...ME, identities: ["auth0", "okta-saml"] }, settings: SETTINGS });
    expect(screen.getByText("Email and password")).toBeInTheDocument();
    expect(screen.queryByText("auth0")).not.toBeInTheDocument();
    expect(screen.getByText("Single sign-on")).toBeInTheDocument();
    expect(screen.queryByText("okta-saml")).not.toBeInTheDocument();
  });

  it("does not repeat the email when it is also the display name", () => {
    show({ me: { ...ME, name: "ani@example.com" }, settings: SETTINGS });
    expect(screen.getAllByText("ani@example.com")).toHaveLength(1);
  });

  it("shows whether the profile is public or private next to the switch", () => {
    show({ me: ME, settings: { isPublic: false, contactEmail: null } });
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("does not render an avatar from a non-http(s) URL", () => {
    show({ me: { ...ME, avatarUrl: "data:image/svg+xml;base64,PHN2Zz4=" }, settings: SETTINGS });
    expect(document.querySelector('img[src^="data:"]')).toBeNull();
  });

  it("renders an http(s) avatar", () => {
    show({
      me: { ...ME, avatarUrl: "https://lh3.googleusercontent.com/a/ani" },
      settings: SETTINGS,
    });
    expect(document.querySelector("img")).toHaveAttribute(
      "src",
      "https://lh3.googleusercontent.com/a/ani",
    );
  });

  it("says when the email is missing or not verified", () => {
    show({ me: { ...ME, email: null, verified: false, identities: [] }, settings: SETTINGS });
    expect(screen.getByText("No email on this account")).toBeInTheDocument();
    expect(screen.getByText("Email not verified")).toBeInTheDocument();
    expect(screen.getByText("No linked accounts yet.")).toBeInTheDocument();
  });

  it("tells an unverified user how to verify, and says nothing to a verified one", () => {
    const { unmount } = show({ me: { ...ME, verified: false }, settings: SETTINGS });
    expect(screen.getByText(/verification email/)).toBeInTheDocument();
    unmount();
    show({ me: ME, settings: SETTINGS });
    expect(screen.queryByText(/verification email/)).not.toBeInTheDocument();
  });

  it("gives no verification hint when there is no email to verify", () => {
    show({ me: { ...ME, email: null, verified: false }, settings: SETTINGS });
    expect(screen.getByText("Email not verified")).toBeInTheDocument();
    expect(screen.queryByText(/verification email/)).not.toBeInTheDocument();
  });

  it("keeps room for the name beside the status chip (phone width)", () => {
    show({ me: ME, settings: SETTINGS });
    // jsdom has no layout: assert the rule that prevents the squeeze (name column min-width).
    expect(getComputedStyle(screen.getByTestId("account-name")).minWidth).toBe("160px");
  });

  it("renders no <main> of its own: the layout has the only one", () => {
    show({ me: ME, settings: SETTINGS });
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  it.each([
    ["API_NOT_CONFIGURED", "The Gradfolio API is not connected to this site yet."],
    ["API_UNREACHABLE", "The Gradfolio API is not responding. Please try again in a moment."],
    ["AUTH_UNAVAILABLE", "The Gradfolio API is not responding. Please try again in a moment."],
    ["RATE_LIMITED", "The Gradfolio API is not responding. Please try again in a moment."],
    ["SOMETHING_NEW", "Your account could not be loaded. Please try again."],
  ])("maps the error code %s to its message", (errorCode, message) => {
    show({ errorCode });
    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  it("offers to sign in again when the session has expired", () => {
    show({ errorCode: "UNAUTHENTICATED" });
    expect(screen.getByRole("alert")).toHaveTextContent("Your session has expired.");
    expect(screen.getByRole("link", { name: "Auth0 Login" })).toHaveAttribute(
      "href",
      "/auth/login?returnTo=/account",
    );
  });
});
