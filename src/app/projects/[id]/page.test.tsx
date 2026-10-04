// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import ProjectDetailPage, { generateMetadata } from "./page";

// Next 16 passes `params` as a Promise; reading it synchronously is an error.
describe("/projects/[id] params", () => {
  it("awaits params for the page", async () => {
    await expect(
      ProjectDetailPage({ params: Promise.resolve({ id: "ecoroute" }) }),
    ).resolves.toBeTruthy();
  });

  it("answers not-found for an unknown id", async () => {
    await expect(ProjectDetailPage({ params: Promise.resolve({ id: "nope" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("awaits params for the metadata", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ id: "ecoroute" }) });
    expect(meta.title).toMatch(/Project$/);
    expect(meta.title).not.toBe("Project");
  });
});
