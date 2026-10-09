// @vitest-environment node
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { sanitizeDescription } from "./sanitize";

/** Known bypasses: each must come out inert. A copy of the vector families in the API's corpus. */
const HOSTILE: [string, string][] = [
  ["script", "<p>a</p><script>alert(1)</script>"],
  ["script in svg", "<svg><script>alert(1)</script></svg><p>v</p>"],
  ["img onerror", "<img src=x onerror=alert(1)>"],
  ["svg onload", "<svg onload=alert(1)></svg>"],
  ["body onload", "<body onload=alert(1)>x"],
  ["onclick on p", '<p onclick="alert(1)">x</p>'],
  ["javascript href", '<a href="javascript:alert(1)">x</a>'],
  ["javascript uppercase", '<a href="JaVaScRiPt:alert(1)">x</a>'],
  ["javascript with tab", '<a href="java\tscript:alert(1)">x</a>'],
  ["javascript with newline", '<a href="java\nscript:alert(1)">x</a>'],
  ["javascript leading space", '<a href=" javascript:alert(1)">x</a>'],
  ["javascript hex entity", '<a href="jav&#x61;script:alert(1)">x</a>'],
  ["javascript decimal entity, no semicolon", '<a href="jav&#97script:alert(1)">x</a>'],
  ["javascript colon entity", '<a href="javascript&colon;alert(1)">x</a>'],
  ["javascript zero-width", '<a href="java\u200bscript:alert(1)">x</a>'],
  ["unquoted javascript", "<a href=javascript:alert(1)>x</a>"],
  ["vbscript", '<a href="vbscript:msgbox(1)">x</a>'],
  ["data url", '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
  ["protocol relative", '<a href="//evil.example/x">x</a>'],
  ["relative", '<a href="/account">x</a>'],
  ["mailto", '<a href="mailto:a@b.co">x</a>'],
  ["iframe srcdoc", '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
  ["object", '<object data="javascript:alert(1)"></object>'],
  ["embed", '<embed src="javascript:alert(1)">'],
  ["form action", '<form action="javascript:alert(1)"><button>x</button></form>'],
  ["style attribute", '<p style="background:url(javascript:alert(1))">x</p>'],
  ["style tag", "<style>@import 'javascript:alert(1)'</style><p>x</p>"],
  ["mathml", '<math><mi xlink:href="javascript:alert(1)">m</mi></math>'],
  [
    "svg animate",
    "<svg><a><animate attributeName=href values=javascript:alert(1) /><text>x</text></a></svg>",
  ],
  ["noscript mutation", '<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
  ["textarea mutation", "<textarea></textarea><img src=x onerror=alert(1)>"],
  ["xmp mutation", "<xmp><img src=x onerror=alert(1)></xmp>"],
  ["template", "<template><script>alert(1)</script></template>"],
  [
    "form-in-table mutation",
    "<table><form><input name=a></form></table><img src=x onerror=alert(1)>",
  ],
  ["class clobber", '<p class="MuiBackdrop-root" id="x" name="y">x</p>'],
  ["data attribute", '<p data-x="1" aria-label="x">x</p>'],
];

/** Executes the output in a scripting jsdom: nothing may call `alert`. */
function runs(html: string): boolean {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`, { runScripts: "dangerously" });
  let called = false;
  (dom.window as unknown as { alert: () => void }).alert = () => (called = true);
  // Let image error handlers fire.
  for (const img of dom.window.document.querySelectorAll("img"))
    img.dispatchEvent(new dom.window.Event("error"));
  // Re-parse the serialized body: a mutation-XSS payload only shows after a second parse.
  const serialized = dom.window.document.body.innerHTML;
  dom.window.document.body.innerHTML = serialized;
  return called;
}

describe("sanitizeDescription", () => {
  it.each(HOSTILE)("neutralizes: %s", (_name, payload) => {
    const out = sanitizeDescription(payload);
    expect(runs(out)).toBe(false);
    expect(out).not.toMatch(
      /<script|<svg|<iframe|<object|<embed|<form|<style|<img|<math|<template/i,
    );
    expect(out).not.toMatch(/\son[a-z]+\s*=/i);
    expect(out).not.toMatch(
      /javascript|vbscript|data:|mailto:|style=|srcdoc|id=|name=|data-|aria-/i,
    );
    expect(out).not.toMatch(/href="(?!https?:\/\/)/);
  });

  it.each(HOSTILE)("is idempotent: %s", (_name, payload) => {
    const once = sanitizeDescription(payload);
    expect(sanitizeDescription(once)).toBe(once);
  });

  it("keeps what the editor emits, and nothing more", () => {
    const html =
      '<h2>T</h2><h3>S</h3><p><strong>b</strong> <em>i</em> <u>u</u> <s>x</s> <code>c</code></p><ul><li>a</li></ul><ol><li>n</li></ol><blockquote><p>q</p></blockquote><pre><code class="language-ts">x</code></pre><hr><p>l<br>2</p>';
    expect(sanitizeDescription(html)).toBe(html);
  });

  it("keeps the words of a refused link, drops the anchor's target", () => {
    expect(sanitizeDescription('<p><a href="javascript:alert(1)">words</a></p>')).toBe(
      "<p><a>words</a></p>",
    );
  });

  it("forces rel and target on a good link, whatever it carried", () => {
    expect(
      sanitizeDescription(
        '<a href="https://example.com/x?a=1&b=2" target="_self" rel="opener">x</a>',
      ),
    ).toBe(
      '<a href="https://example.com/x?a=1&amp;b=2" rel="noopener noreferrer nofollow" target="_blank">x</a>',
    );
  });

  it.each([
    ['<p class="MuiBackdrop-root">x</p>', "<p>x</p>"],
    ['<a class="MuiBackdrop-root" href="https://e.test/">x</a>', null],
    [
      '<pre class="language-ts"><code class="language-ts">x</code></pre>',
      '<pre><code class="language-ts">x</code></pre>',
    ],
  ])("keeps class on code[language-*] only: %s", (input, expected) => {
    const out = sanitizeDescription(input);
    if (expected !== null) expect(out).toBe(expected);
    else expect(out).not.toContain("class");
  });

  it("drops a class that is not a language class", () => {
    expect(sanitizeDescription('<code class="language-ts bad">x</code>')).toBe("<code>x</code>");
  });

  it("returns an empty string for nothing", () => {
    expect(sanitizeDescription(null)).toBe("");
    expect(sanitizeDescription("")).toBe("");
  });

  it("fails closed when no DOM is available", async () => {
    vi.resetModules();
    vi.doMock("isomorphic-dompurify", () => ({
      default: { isSupported: false, sanitize: (x: string) => x, addHook: () => {} },
    }));
    const { sanitizeDescription: noDom } = await import("./sanitize");
    expect(() => noDom("<p>x</p>")).toThrow("no DOM");
    vi.doUnmock("isomorphic-dompurify");
  });
});
