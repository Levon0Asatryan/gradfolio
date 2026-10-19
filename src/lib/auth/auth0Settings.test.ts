import { afterEach, describe, expect, it, vi } from "vitest";
import {
  auth0ConnectSettings,
  githubConnectionName,
  isDomain,
  normalizeDomain,
} from "./auth0Settings";

const good = {
  AUTH0_DOMAIN: "tenant.us.auth0.com",
  AUTH0_CLIENT_ID: "cid",
  AUTH0_CLIENT_SECRET: "csecret",
};

afterEach(() => vi.restoreAllMocks());

describe("isDomain", () => {
  it("accepts a domain and refuses anything with a scheme, path or space", () => {
    expect(isDomain("dev-abc.us.auth0.com")).toBe(true);
    expect(isDomain("https://dev-abc.us.auth0.com")).toBe(false);
    expect(isDomain("evil.com/path")).toBe(false);
    expect(isDomain("a b")).toBe(false);
    expect(isDomain(undefined)).toBe(false);
  });
});

describe("normalizeDomain", () => {
  it("strips scheme, slashes, space and case, and nothing else", () => {
    expect(normalizeDomain(" HTTPS://Tenant.auth0.com// ")).toBe("tenant.auth0.com");
    expect(normalizeDomain("tenant.auth0.com")).toBe("tenant.auth0.com");
    expect(normalizeDomain(undefined)).toBeUndefined();
    // A path survives, so isDomain still refuses it.
    expect(isDomain(normalizeDomain("https://t.auth0.com/x"))).toBe(false);
  });
});

describe("githubConnectionName", () => {
  it("defaults to github, trims, and keeps case", () => {
    expect(githubConnectionName(undefined)).toEqual({ name: "github", invalid: false });
    expect(githubConnectionName("  ")).toEqual({ name: "github", invalid: false });
    expect(githubConnectionName(" GitHub ")).toEqual({ name: "GitHub", invalid: false });
  });
  it("accepts up to Auth0's 128 characters", () => {
    for (const n of [1, 64, 65, 127, 128]) {
      expect(githubConnectionName("x".repeat(n))).toEqual({ name: "x".repeat(n), invalid: false });
    }
  });
  it("refuses a value outside [A-Za-z0-9_-]{1,128} and says so", () => {
    for (const bad of ["git hub", "github&prompt=none", "a/b", "x".repeat(129), "gïthub"]) {
      expect(githubConnectionName(bad)).toEqual({ name: "github", invalid: true });
    }
  });
});

describe("auth0ConnectSettings", () => {
  it.each([
    ["a bare host", "tenant.us.auth0.com"],
    ["with https://", "https://tenant.us.auth0.com"],
    ["with a trailing slash", "https://tenant.us.auth0.com/"],
    ["in capitals, padded", "  HTTPS://Tenant.US.Auth0.com/\n"],
  ])("normalises AUTH0_DOMAIN %s to the bare host", (_name, value) => {
    const s = auth0ConnectSettings({ ...good, AUTH0_DOMAIN: value }, { needSecret: true });
    expect(s).toMatchObject({ ok: true, domain: "tenant.us.auth0.com" });
  });

  it("trims the client id and secret", () => {
    const s = auth0ConnectSettings(
      { ...good, AUTH0_CLIENT_ID: " cid\n", AUTH0_CLIENT_SECRET: "csecret\n" },
      { needSecret: true },
    );
    expect(s).toMatchObject({ ok: true, clientId: "cid", clientSecret: "csecret" });
  });

  it("names, never shows, what is unusable", () => {
    const s = auth0ConnectSettings(
      { AUTH0_DOMAIN: "evil.example/path", AUTH0_CLIENT_ID: "  " },
      { needSecret: true },
    );
    expect(s).toEqual({
      ok: false,
      unusable: ["AUTH0_DOMAIN", "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET"],
    });
  });

  it("needs the secret only when asked", () => {
    const env = { ...good, AUTH0_CLIENT_SECRET: undefined };
    expect(auth0ConnectSettings(env, { needSecret: false }).ok).toBe(true);
    expect(auth0ConnectSettings(env, { needSecret: true })).toEqual({
      ok: false,
      unusable: ["AUTH0_CLIENT_SECRET"],
    });
  });

  it("falls back to the default connection and logs the setting's name, not its value", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const s = auth0ConnectSettings(
      { ...good, AUTH0_GITHUB_CONNECTION: "git hub&x=SECRETISH" },
      { needSecret: true },
    );
    expect(s).toMatchObject({ ok: true, connection: "github" });
    expect(error).toHaveBeenCalledTimes(1);
    const line = String(error.mock.calls[0]?.[0]);
    expect(JSON.parse(line)).toMatchObject({ setting: "AUTH0_GITHUB_CONNECTION" });
    expect(line).not.toContain("SECRETISH");
  });

  it("passes a valid connection Name through unchanged in case", () => {
    const s = auth0ConnectSettings(
      { ...good, AUTH0_GITHUB_CONNECTION: " GitHub " },
      { needSecret: true },
    );
    expect(s).toMatchObject({ ok: true, connection: "GitHub" });
  });
});
