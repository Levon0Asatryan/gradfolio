import { fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { EmailUnsubscribe } from "./EmailUnsubscribe";
afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});
describe("unsubscribe confirmation", () => {
  it.each([429, 503, 500])("keeps a valid link retryable after HTTP %s", async (status) => {
    localStorage.clear();
    window.history.replaceState(null, "", "/email/unsubscribe#signed-token");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    render(
      <LanguageProvider>
        <EmailUnsubscribe />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Turn off invitation emails" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please wait and try again");
    expect(screen.queryByText(/This link is invalid/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Turn off invitation emails" }));
    await screen.findByText(/Invitation emails are off/);
  });

  it("reserves the invalid-link error for a token-related 400", async () => {
    localStorage.clear();
    window.history.replaceState(null, "", "/email/unsubscribe#bad-token");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ code: "INVALID_UNSUBSCRIBE_TOKEN" }), { status: 400 }),
        ),
    );
    render(
      <LanguageProvider>
        <EmailUnsubscribe />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Turn off invitation emails" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid or expired");
  });

  it("shows a retry error on network failure", async () => {
    localStorage.clear();
    window.history.replaceState(null, "", "/email/unsubscribe#signed-token");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(
      <LanguageProvider>
        <EmailUnsubscribe />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Turn off invitation emails" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please wait and try again");
  });
  it("does not mutate on GET and removes the token from the address before explicit confirmation", async () => {
    localStorage.clear();
    document.cookie = "language=; max-age=0; path=/";
    window.history.replaceState(null, "", "/email/unsubscribe#signed-token");
    const fetcher = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    render(
      <StrictMode>
        <LanguageProvider>
          <EmailUnsubscribe />
        </LanguageProvider>
      </StrictMode>,
    );
    expect(window.location.hash).toBe("");
    expect(fetcher).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Turn off invitation emails" }));
    await screen.findByText(/Invitation emails are off/);
    expect(JSON.parse(fetcher.mock.calls[0]![1].body)).toEqual({ token: "signed-token" });
  });
});
