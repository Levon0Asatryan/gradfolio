import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { FlashToast } from "./FlashToast";

const nav = vi.hoisted(() => ({ replace: vi.fn(), query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/projects/p1",
  useSearchParams: () => new URLSearchParams(nav.query),
}));

beforeEach(() => {
  nav.replace.mockReset();
  nav.query = "";
});

describe("FlashToast", () => {
  it.each([
    ["created", "Project created"],
    ["saved", "Changes saved"],
    ["deleted", "Project deleted"],
  ])("?flash=%s shows its message and clears the flag", async (flash, message) => {
    nav.query = `flash=${flash}&x=1`;
    renderInApp(<FlashToast />);
    expect(await screen.findByText(message)).toBeVisible();
    expect(nav.replace).toHaveBeenCalledWith("/projects/p1?x=1");
  });

  it("shows nothing for no flag, and never echoes an unknown one", () => {
    nav.query = "flash=<script>alert(1)</script>";
    renderInApp(<FlashToast />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
