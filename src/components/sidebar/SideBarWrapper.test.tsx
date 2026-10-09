import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { SidebarVisibilityProvider } from "@/components/layout/SidebarVisibilityContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { SideBarWrapper } from "./SideBarWrapper";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
vi.mock("@/lib/notifications/actions", () => ({
  markNotificationReadAction: vi.fn(),
  markAllNotificationsReadAction: vi.fn(),
  respondToInviteAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/search", useRouter: () => ({}) }));

describe("SideBarWrapper", () => {
  it("wraps every page in one main landmark that the skip link can target", () => {
    render(
      <ThemeWrapper>
        <LanguageProvider>
          <SidebarVisibilityProvider>
            <SideBarWrapper>
              <h1>Page</h1>
            </SideBarWrapper>
          </SidebarVisibilityProvider>
        </LanguageProvider>
      </ThemeWrapper>,
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toContainElement(screen.getByRole("heading", { name: "Page" }));
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});

describe("frame", () => {
  it("renders the sidebar and the phone bar (CSS picks one), both labelled", () => {
    render(
      <ThemeWrapper>
        <LanguageProvider>
          <SidebarVisibilityProvider>
            <SideBarWrapper user={{ name: "Ani" }}>
              <p>Page</p>
            </SideBarWrapper>
          </SidebarVisibilityProvider>
        </LanguageProvider>
      </ThemeWrapper>,
    );
    expect(screen.getAllByRole("navigation", { name: "Main menu" })).toHaveLength(2);
    expect(screen.getByText("Page")).toBeInTheDocument();
  });
});

describe("skip target focus", () => {
  it("never suppresses the focus ring on the focusable main (the skip link lands there)", () => {
    render(
      <ThemeWrapper>
        <LanguageProvider>
          <SidebarVisibilityProvider>
            <SideBarWrapper>
              <p>Page</p>
            </SideBarWrapper>
          </SidebarVisibilityProvider>
        </LanguageProvider>
      </ThemeWrapper>,
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main.style.outline).not.toBe("none");
  });

  it("no source file turns the outline off (the global :focus-visible ring must reach every target)", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
    const offenders = walk(join(process.cwd(), "src"))
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
      .filter((f) => /outline:\s*["']none["']/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});

describe("landmarks", () => {
  it("no page declares its own main: the layout's is the only one (a nested main is invalid)", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
    const offenders = walk(join(process.cwd(), "src"))
      .filter(
        (f) => /\.tsx$/.test(f) && !/\.test\.tsx$/.test(f) && !f.endsWith("SideBarWrapper.tsx"),
      )
      .filter((f) => /<main[\s>]|component="main"/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});

describe("stored sidebar choice", () => {
  it("passes the cookie's choice to the sidebar so the first render is already collapsed", () => {
    render(
      <ThemeWrapper>
        <LanguageProvider>
          <SidebarVisibilityProvider>
            <SideBarWrapper initialNav="rail">
              <p>Page</p>
            </SideBarWrapper>
          </SidebarVisibilityProvider>
        </LanguageProvider>
      </ThemeWrapper>,
    );
    expect(screen.getByRole("button", { name: "Sidebar" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

describe("notifications data", () => {
  it("is read for a signed-in user and never for a visitor", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ count: 1 }), { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const frame = (user: { name: string } | null) => (
      <ThemeWrapper>
        <LanguageProvider>
          <SidebarVisibilityProvider>
            <SideBarWrapper user={user}>
              <h1>Page</h1>
            </SideBarWrapper>
          </SidebarVisibilityProvider>
        </LanguageProvider>
      </ThemeWrapper>
    );
    const visitor = render(frame(null));
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
    visitor.unmount();
    render(frame({ name: "Ani" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/notifications/unread-count", expect.anything()),
    );
    vi.unstubAllGlobals();
  });
});
