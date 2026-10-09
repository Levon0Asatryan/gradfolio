// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout/Panel", () => ({
  Panel: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section aria-label={title}>{children}</section>
  ),
}));

const { default: ProjectDescription } = await import("./ProjectDescription");

const render = (html: string | null) =>
  renderToStaticMarkup(ProjectDescription({ html, title: "Description" }) ?? <i />);

describe("ProjectDescription", () => {
  it("renders the story with its formatting", () => {
    expect(render("<p>The <strong>story</strong>.</p>")).toContain(
      "<p>The <strong>story</strong>.</p>",
    );
  });

  it("renders stored HTML inert even if the API's copy was not (second layer)", () => {
    const out = render(
      '<p onclick="alert(1)">x</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><img src=x onerror=alert(1)>',
    );
    expect(out).not.toMatch(/onclick|<script|javascript:|<img|onerror/i);
    expect(out).toContain("x");
  });

  it("renders nothing for an empty description", () => {
    expect(ProjectDescription({ html: null, title: "Description" })).toBeNull();
    expect(ProjectDescription({ html: "<script>alert(1)</script>", title: "D" })).toBeNull();
  });
});
