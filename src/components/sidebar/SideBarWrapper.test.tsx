import { render, screen } from "@testing-library/react";
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
