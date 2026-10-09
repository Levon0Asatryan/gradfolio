import DOMPurify from "isomorphic-dompurify";

/**
 * The render-time second layer for a project's description (tracker 4.8, F1). The API
 * sanitizes on write with sanitize-html; this is a different engine (DOMPurify on a
 * spec-compliant DOM), so one parser's bug is not the other's. The allow-list is the
 * API's (docs/m4-plan.md §4.1 there): nothing here may be wider.
 *
 * Runs on the server (the detail page is a server component), so unsanitized HTML
 * never reaches the browser. It fails closed: with no DOM it throws, it never hands
 * back its input.
 */
const ALLOWED_TAGS = [
  "h2",
  "h3",
  "h4",
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "hr",
];

const LINK_REL = "noopener noreferrer nofollow";
const CODE_CLASS = /^language-[a-z0-9+#-]{1,20}$/;
// Control and invisible characters inside a URL are how scheme filters get bypassed.
const HTTP_URL =
  // eslint-disable-next-line no-control-regex
  /^https?:\/\/[^\s\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060\ufeff]+$/i;

let hooked = false;
function install(): void {
  if (hooked) return;
  hooked = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href");
      if (href !== null && !HTTP_URL.test(href)) {
        // Not a link we would follow: keep the words, drop the anchor.
        node.removeAttribute("href");
      }
      if (node.hasAttribute("href")) {
        node.setAttribute("rel", LINK_REL);
        node.setAttribute("target", "_blank");
      } else {
        node.removeAttribute("rel");
        node.removeAttribute("target");
      }
    }
    if (node.tagName === "CODE" && node.hasAttribute("class")) {
      if (!CODE_CLASS.test(node.getAttribute("class") ?? "")) node.removeAttribute("class");
    }
  });
}

export function sanitizeDescription(html: string | null | undefined): string {
  if (!html) return "";
  if (!DOMPurify.isSupported) throw new Error("sanitizeDescription: no DOM available");
  install();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOWED_URI_REGEXP: /^https?:/i,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  });
}
