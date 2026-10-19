import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";

const nav = vi.hoisted(() => ({ query: "", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.query),
  useRouter: () => ({ replace: nav.replace, refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/integrations",
}));

const { GithubReturnNotice } = await import("./GithubReturnNotice");

beforeEach(() => {
  nav.replace.mockReset();
  nav.query = "";
});

describe("GithubReturnNotice", () => {
  it("confirms a connection only when the status says connected, and cleans the URL", async () => {
    nav.query = "github=connected";
    renderInApp(<GithubReturnNotice connected />);
    expect(await screen.findByText("GitHub is connected.")).toBeVisible();
    expect(nav.replace).toHaveBeenCalledWith("/integrations");
  });

  it("removes the import hint with the rest, so a reload cannot reopen the dialog", async () => {
    nav.query = "github=connected&import=1&tab=x";
    renderInApp(<GithubReturnNotice connected />);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/integrations?tab=x"));
  });

  it("a forged ?github=connected on a disconnected account claims nothing", async () => {
    nav.query = "github=connected";
    renderInApp(<GithubReturnNotice connected={false} />);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/integrations"));
    expect(screen.queryByText("GitHub is connected.")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("maps a known reason to its fixed message", async () => {
    nav.query = "github=error&reason=GITHUB_ACCOUNT_IN_USE";
    renderInApp(<GithubReturnNotice connected={false} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That GitHub account already belongs to another Gradfolio account.",
    );
  });

  it("never renders text from the URL: an unknown reason is the generic message", async () => {
    nav.query = "github=error&reason=%3Cb%3EYou%20won%20a%20prize%3C%2Fb%3E";
    renderInApp(<GithubReturnNotice connected={false} />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong. Try again.");
    expect(alert).not.toHaveTextContent(/prize/);
  });

  it("is translated", async () => {
    nav.query = "github=error&reason=ACCESS_DENIED";
    renderInApp(<GithubReturnNotice connected={false} />, "am");
    expect(await screen.findByRole("alert")).toHaveTextContent("GitHub-ի հասանելիությունը չտրվեց");
  });

  it("does nothing without a result", () => {
    renderInApp(<GithubReturnNotice connected />);
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
