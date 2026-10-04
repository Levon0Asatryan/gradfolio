import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ProfileError } from "./ProfileError";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const show = (code: string) =>
  render(
    <LanguageProvider>
      <ProfileError code={code} returnTo="/profile/abc" />
    </LanguageProvider>,
  );

describe("ProfileError", () => {
  it.each([
    ["API_NOT_CONFIGURED", /not connected/],
    ["API_UNREACHABLE", /not responding/],
    ["DATABASE_UNAVAILABLE", /not responding/],
    ["WHATEVER", /Something went wrong/],
  ])("%s shows its message and a retry", (code, text) => {
    show(code);
    expect(screen.getByRole("alert")).toHaveTextContent(text);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("asks an expired session to sign in again, back to the same page", () => {
    show("UNAUTHENTICATED");
    expect(screen.getByRole("link", { name: "Auth0 Login" })).toHaveAttribute(
      "href",
      "/auth/login?returnTo=%2Fprofile%2Fabc",
    );
  });
});
