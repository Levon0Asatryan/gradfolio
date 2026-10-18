import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import { SignInPrompt } from "./SignInPrompt";
import { en } from "@/data/locales/en";
import { ru } from "@/data/locales/ru";
import { am } from "@/data/locales/am";

describe("personal section prompt", () => {
  it.each([
    ["en", en],
    ["ru", ru],
    ["am", am],
  ] as const)("explains sign in and offers an escape in %s", (language, t) => {
    renderInApp(<SignInPrompt returnTo="/projects/new?draft=1" />, language);
    expect(screen.getByRole("heading", { level: 1, name: t.common.signInRequired })).toBeVisible();
    expect(screen.getByRole("link", { name: t.common.login })).toHaveAttribute(
      "href",
      "/auth/login?returnTo=%2Fprojects%2Fnew%3Fdraft%3D1",
    );
    expect(screen.getByRole("link", { name: t.common.continueBrowsing })).toHaveAttribute(
      "href",
      "/search",
    );
  });
});
