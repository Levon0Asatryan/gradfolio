import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/linkedin/actions", () => ({
  startLinkedinUploadAction: vi.fn(),
  previewLinkedinAction: vi.fn(),
  confirmLinkedinAction: vi.fn(),
}));

const { LinkedinCard } = await import("./LinkedinCard");

describe("LinkedinCard", () => {
  for (const status of ["connected", "not_connected"] as const) {
    it(`shows no connection status when the API says ${status}`, () => {
      renderInApp(<LinkedinCard linkedin={{ status, lastSyncedAt: null }} />);
      expect(screen.queryByText("Connected")).toBeNull();
      expect(screen.queryByText("Not connected")).toBeNull();
      expect(screen.queryByText(/sign in with LinkedIn/i)).toBeNull();
      expect(screen.getByRole("button", { name: "Import from LinkedIn export" })).toBeVisible();
    });
  }
});
