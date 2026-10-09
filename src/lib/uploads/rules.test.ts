import { describe, expect, it } from "vitest";
import { acceptAttribute, checkFile, MAX_IMAGE_BYTES, MAX_PDF_BYTES } from "./rules";

const file = (type: string, size: number) => ({ type, size });

describe("checkFile", () => {
  it.each(["image/png", "image/jpeg", "image/webp", "image/gif"])(
    "accepts %s up to 5 MB",
    (type) => {
      expect(checkFile(file(type, MAX_IMAGE_BYTES), "image")).toBe("ok");
      expect(checkFile(file(type, MAX_IMAGE_BYTES + 1), "image")).toBe("too_big");
    },
  );

  it("accepts a PDF up to 20 MB, only where a file is allowed", () => {
    expect(checkFile(file("application/pdf", MAX_PDF_BYTES), "file")).toBe("ok");
    expect(checkFile(file("application/pdf", MAX_PDF_BYTES + 1), "file")).toBe("too_big");
    expect(checkFile(file("application/pdf", 10), "image")).toBe("type");
  });

  it.each(["image/svg+xml", "text/html", "application/zip", "", "image/png; x=1"])(
    "refuses type %j",
    (type) => {
      expect(checkFile(file(type, 10), "file")).toBe("type");
    },
  );

  it("refuses an empty file", () => {
    expect(checkFile(file("image/png", 0), "image")).toBe("empty");
  });

  it("offers the file picker only the allowed types", () => {
    expect(acceptAttribute("image")).toBe("image/png,image/jpeg,image/webp,image/gif");
    expect(acceptAttribute("file")).toContain("application/pdf");
    expect(acceptAttribute("image")).not.toContain("svg");
  });
});
