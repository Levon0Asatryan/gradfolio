import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
  identities: ["google-oauth2"],
};

const show = (result: AccountResult) =>
  render(
    <LanguageProvider>
      <AccountSummary result={result} />
    </LanguageProvider>,
  );

describe("AccountSummary", () => {
  it("shows the account the API returned", () => {
    show({ me: ME });
    expect(screen.getByRole("heading", { name: "My Account" })).toBeInTheDocument();
    expect(screen.getByText("Ani Petrosyan")).toBeInTheDocument();
    expect(screen.getByText("ani@example.com")).toBeInTheDocument();
    expect(screen.getByText("Email verified")).toBeInTheDocument();
    expect(screen.getByText(/google-oauth2/)).toBeInTheDocument();
  });

  it("does not render an avatar from a non-http(s) URL", () => {
    show({ me: { ...ME, avatarUrl: "data:image/svg+xml;base64,PHN2Zz4=" } });
    expect(document.querySelector('img[src^="data:"]')).toBeNull();
  });

  it("renders an http(s) avatar", () => {
    show({ me: { ...ME, avatarUrl: "https://lh3.googleusercontent.com/a/ani" } });
    expect(document.querySelector("img")).toHaveAttribute(
      "src",
      "https://lh3.googleusercontent.com/a/ani",
    );
  });

  it("says when the email is missing or not verified", () => {
    show({ me: { ...ME, email: null, verified: false, identities: [] } });
    expect(screen.getByText("No email on this account")).toBeInTheDocument();
    expect(screen.getByText("Email not verified")).toBeInTheDocument();
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
