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
