import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import type { ProjectAttachment } from "@/lib/api/types";
import AttachmentsGallery, { safeEmbedUrl } from "./AttachmentsGallery";

const att = (over: Partial<ProjectAttachment>): ProjectAttachment => ({
  id: "a1",
  type: "video",
  url: "https://youtu.be/dQw4w9WgXcQ",
  title: "Demo",
  thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  ...over,
});

describe("safeEmbedUrl", () => {
  it.each([
    ["https://www.youtube-nocookie.com/embed/abc", true],
    ["https://player.vimeo.com/video/123", true],
    ["https://www.youtube.com/embed/abc", false],
    ["https://www.youtube-nocookie.com.evil.test/embed/abc", false],
    ["http://www.youtube-nocookie.com/embed/abc", false],
    ["javascript:alert(1)", false],
    ["https://evil.test/https://www.youtube-nocookie.com/embed/", false],
    [null, false],
  ])("%s -> %s", (url, ok) => {
    expect(safeEmbedUrl(url)).toBe(ok ? url : undefined);
  });
});

describe("AttachmentsGallery", () => {
  it("embeds a video through the API's embedUrl, never the user's link", () => {
    renderInApp(<AttachmentsGallery items={[att({})]} />);
    expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute(
      "href",
      "https://youtu.be/dQw4w9WgXcQ",
    );
  });

  it("does not offer a javascript: video link", () => {
    renderInApp(
      <AttachmentsGallery items={[att({ url: "javascript:alert(1)", embedUrl: null })]} />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
  });

  it("opens an image in a dialog, and an iframe only for a safe embed", () => {
    renderInApp(
      <AttachmentsGallery
        items={[
          att({
            id: "i1",
            type: "image",
            url: "https://x.test/a.png",
            thumbnailUrl: null,
            title: "Map",
          }),
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("renders no http image", () => {
    renderInApp(
      <AttachmentsGallery
        items={[att({ id: "i1", type: "image", url: "http://x.test/a.png", thumbnailUrl: null })]}
      />,
    );
    expect(document.querySelector("img")).toBeNull();
  });

  it("shows a pdf as a link with the file name", () => {
    renderInApp(
      <AttachmentsGallery
        items={[
          att({
            id: "p1",
            type: "pdf",
            url: "https://x.test/r.pdf",
            title: "Report",
            embedUrl: null,
            thumbnailUrl: null,
          }),
        ]}
      />,
    );
    expect(screen.getByText("Report")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open PDF" })).toHaveAttribute(
      "href",
      "https://x.test/r.pdf",
    );
  });

  it("says there are no attachments", () => {
    renderInApp(<AttachmentsGallery items={[]} />);
    expect(screen.getByText("No attachments provided.")).toBeVisible();
  });
});
