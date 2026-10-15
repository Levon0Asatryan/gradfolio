// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ link: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/client", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
    ) {
      super(message);
    }
  }
  return { ApiError, linkGithub: mocks.link };
});

const { GET } = await import("./route");
const { ApiError } = await import("@/lib/api/client");

const call = (query: string, cookie: string | null = "S1", from?: string) =>
  GET(
    new NextRequest(`https://app.example/integrations/github/callback?${query}`, {
      headers: {
        cookie: [cookie ? `gh_link_state=${cookie}` : "", from ? `gh_link_return=${from}` : ""]
          .filter(Boolean)
          .join("; "),
      },
    }),
  );

const fetchMock = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("AUTH0_DOMAIN", "tenant.us.auth0.com");
  vi.stubEnv("AUTH0_CLIENT_ID", "cid");
  vi.stubEnv("AUTH0_CLIENT_SECRET", "csecret");
  vi.stubEnv("APP_BASE_URL", "https://app.example");
  vi.stubEnv("VERCEL_ENV", "");
});
afterEach(() => vi.unstubAllGlobals());

const location = (r: Response) => new URL(r.headers.get("location") ?? "");

describe("GitHub link callback", () => {
  it("exchanges the code on the server, links once, and returns a fixed word", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id_token: "ID.TOKEN.X", access_token: "AT" })),
    );
    mocks.link.mockResolvedValue({ state: "connected", login: "ani-p" });
    const response = await call("code=C1&state=S1");
    expect(location(response).pathname).toBe("/integrations");
    expect(location(response).searchParams.get("github")).toBe("connected");
    // The exchange is a server-to-server POST with the secret; the API gets only the id token.
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://tenant.us.auth0.com/oauth/token");
    expect(JSON.parse(init.body)).toMatchObject({
      grant_type: "authorization_code",
      code: "C1",
      client_secret: "csecret",
      redirect_uri: "https://app.example/integrations/github/callback",
    });
    expect(mocks.link).toHaveBeenCalledWith("ID.TOKEN.X");
    // Neither token reaches the browser: not in the redirect, not in a cookie.
    expect(response.headers.get("location")).not.toMatch(/ID\.TOKEN|AT|csecret/);
    expect(response.headers.get("set-cookie")).not.toMatch(/ID\.TOKEN|csecret/);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("exchanges against the tenant whatever form AUTH0_DOMAIN has", async () => {
    vi.stubEnv("AUTH0_DOMAIN", "https://Tenant.us.auth0.com/");
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ id_token: "T" })));
    mocks.link.mockResolvedValue({ state: "connected", login: "a" });
    await call("code=C1&state=S1");
    expect(fetchMock.mock.calls[0]![0]).toBe("https://tenant.us.auth0.com/oauth/token");
  });

  it("clears the state cookie on every outcome", async () => {
    const response = await call("code=C1&state=WRONG");
    expect(response.headers.get("set-cookie")).toMatch(/gh_link_state=;/);
  });

  it("refuses a state that is not this browser's, before any exchange or link", async () => {
    for (const [query, cookie] of [
      ["code=C1&state=OTHER", "S1"],
      ["code=C1&state=S1", null],
      ["code=C1", "S1"],
    ] as const) {
      const response = await call(query, cookie);
      expect(location(response).searchParams.get("reason")).toBe("STATE_MISMATCH");
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.link).not.toHaveBeenCalled();
  });

  it("reports a cancelled GitHub sign-in", async () => {
    const response = await call("error=access_denied&state=S1");
    expect(location(response).searchParams.get("reason")).toBe("ACCESS_DENIED");
    expect(mocks.link).not.toHaveBeenCalled();
  });

  it.each([
    ["a failed exchange", () => fetchMock.mockResolvedValue(new Response("{}", { status: 400 }))],
    ["no id token", () => fetchMock.mockResolvedValue(new Response(JSON.stringify({})))],
    ["a network error", () => fetchMock.mockRejectedValue(new Error("down"))],
  ])("%s ends as EXCHANGE_FAILED without linking", async (_name, arrange) => {
    arrange();
    const response = await call("code=C1&state=S1");
    expect(location(response).searchParams.get("reason")).toBe("EXCHANGE_FAILED");
    expect(mocks.link).not.toHaveBeenCalled();
  });

  it("returns the API's code from the closed list, and nothing else", async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ id_token: "T" })));
    mocks.link.mockRejectedValue(new ApiError(409, "GITHUB_LINK_IN_PROGRESS", "x"));
    expect(location(await call("code=C1&state=S1")).searchParams.get("reason")).toBe(
      "GITHUB_LINK_IN_PROGRESS",
    );
    mocks.link.mockRejectedValue(new ApiError(500, "SOMETHING_NEW", "x"));
    expect(location(await call("code=C1&state=S1")).searchParams.get("reason")).toBe("UNKNOWN");
  });

  it("returns to the onboarding page that started the flow", async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ id_token: "T" })));
    mocks.link.mockResolvedValue({ state: "connected", login: "a" });
    const ok = await call("code=C1&state=S1", "S1", "connections");
    expect(location(ok).pathname).toBe("/integrations/connections");
    // A failure goes back there too, so the stepper shows it.
    const bad = await call("code=C1&state=WRONG", "S1", "connections");
    expect(location(bad).pathname).toBe("/integrations/connections");
    expect(bad.headers.get("set-cookie")).toMatch(/gh_link_return=;/);
  });

  it("a return cookie that is not on the closed list is the integrations page", async () => {
    const response = await call("code=C1&state=WRONG", "S1", "https%3A%2F%2Fevil.example");
    expect(location(response).origin).toBe("https://app.example");
    expect(location(response).pathname).toBe("/integrations");
  });

  it("redirects only to /integrations on this deployment, whatever the request says", async () => {
    const response = await call("code=C1&state=WRONG&returnTo=https://evil.example");
    expect(location(response).origin).toBe("https://app.example");
    expect(location(response).pathname).toBe("/integrations");
  });
});
