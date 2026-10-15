import { describe, expect, it } from "vitest";
import { INTEGRATION_ERROR_CODES, errorCode } from "./errors";
import {
  RETURN_REASONS,
  appOrigin,
  authorizeUrl,
  isDomain,
  newState,
  sameState,
  toReturnReason,
} from "./githubLink";

describe("authorizeUrl", () => {
  it("is Auth0's /authorize for the github connection, with state and nonce, and forces a login", () => {
    const url = authorizeUrl({
      domain: "tenant.us.auth0.com",
      clientId: "cid",
      redirectUri: "https://app.example/integrations/github/callback",
      state: "s",
      nonce: "n",
    });
    expect(url.origin).toBe("https://tenant.us.auth0.com");
    expect(url.pathname).toBe("/authorize");
    const p = url.searchParams;
    expect(p.get("connection")).toBe("github");
    expect(p.get("response_type")).toBe("code");
    expect(p.get("prompt")).toBe("login");
    expect(p.get("state")).toBe("s");
    expect(p.get("nonce")).toBe("n");
    expect(p.get("redirect_uri")).toBe("https://app.example/integrations/github/callback");
    // No secret, and no token, ever belongs in this URL.
    expect(url.search).not.toMatch(/secret|token/i);
  });

  it("encodes a nonce that carries URL syntax", () => {
    const url = authorizeUrl({
      domain: "t.auth0.com",
      clientId: "c",
      redirectUri: "https://a/b",
      state: "s",
      nonce: "a&b=c#d",
    });
    expect(url.searchParams.get("nonce")).toBe("a&b=c#d");
    expect(url.hash).toBe("");
  });
});

describe("state", () => {
  it("matches only the same value", () => {
    expect(sameState("abc", "abc")).toBe(true);
    expect(sameState("abc", "abd")).toBe(false);
    expect(sameState("abc", "ab")).toBe(false);
    expect(sameState(undefined, "abc")).toBe(false);
    expect(sameState("abc", null)).toBe(false);
    expect(sameState("", "")).toBe(false);
  });
  it("is long and different each time", () => {
    const a = newState();
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(newState()).not.toBe(a);
  });
});

describe("return reasons", () => {
  it("keeps a known code and collapses everything else", () => {
    expect(toReturnReason("GITHUB_ACCOUNT_IN_USE")).toBe("GITHUB_ACCOUNT_IN_USE");
    expect(toReturnReason("<script>")).toBe("UNKNOWN");
    expect(toReturnReason(null)).toBe("UNKNOWN");
    expect(toReturnReason("GITHUB_REVOKE_FAILED")).toBe("UNKNOWN"); // not a return reason
  });
  it("every reason has a message code", () => {
    for (const reason of RETURN_REASONS) expect(errorCode(reason)).toBe(reason);
    expect(INTEGRATION_ERROR_CODES).toContain("GITHUB_REVOKE_FAILED");
  });
});

describe("config", () => {
  it("accepts a domain and refuses anything with a scheme, path or space", () => {
    expect(isDomain("dev-abc.us.auth0.com")).toBe(true);
    expect(isDomain("https://dev-abc.us.auth0.com")).toBe(false);
    expect(isDomain("evil.com/path")).toBe(false);
    expect(isDomain("a b")).toBe(false);
    expect(isDomain(undefined)).toBe(false);
  });
  it("the origin is the preview's branch host, else APP_BASE_URL", () => {
    expect(appOrigin({ APP_BASE_URL: "https://main.example/x" }, undefined)).toBe(
      "https://main.example",
    );
    expect(appOrigin({ APP_BASE_URL: "https://main.example" }, "https://branch.vercel.app")).toBe(
      "https://branch.vercel.app",
    );
    expect(appOrigin({}, undefined)).toBeNull();
    expect(appOrigin({ APP_BASE_URL: "not a url" }, undefined)).toBeNull();
  });
});
