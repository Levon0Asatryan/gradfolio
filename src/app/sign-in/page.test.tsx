import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import SignInPage from "./page";

describe("sign-in page request boundary", () => {
  it("sanitizes an external query destination before rendering the login link", async () => {
    renderInApp(
      await SignInPage({ searchParams: Promise.resolve({ returnTo: "https://evil.test" }) }),
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/login?returnTo=%2F",
    );
  });
  it("retains the protected destination and its query", async () => {
    renderInApp(
      await SignInPage({ searchParams: Promise.resolve({ returnTo: "/projects/new?draft=1" }) }),
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/login?returnTo=%2Fprojects%2Fnew%3Fdraft%3D1",
    );
  });
});
