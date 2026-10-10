// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const sdk = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
vi.mock("@/lib/auth0", () => ({ auth0: sdk }));
const incoming = vi.hoisted(() => ({ forwardedFor: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers(incoming.forwardedFor ? { "x-forwarded-for": incoming.forwardedFor } : {}),
}));

const {
  ApiError,
  forwardedClientHeaders,
  searchAll,
  searchPeople,
  searchProjects,
  getTag,
  listTagProjects,
  listTagPeople,
} = await import("./client");

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;
const lastCall = () => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [URL, RequestInit];
  return { url, headers: new Headers(init.headers) };
};

beforeEach(() => {
  process.env.API_BASE_URL = "https://api.test";
  delete process.env.API_PROXY_SECRET;
  incoming.forwardedFor = null;
  fetchMock = vi.fn(() => Promise.resolve(json(200, { items: [], nextCursor: null })));
  vi.stubGlobal("fetch", fetchMock);
  sdk.getAccessToken.mockResolvedValue({ token: "user-token" });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("public discovery calls carry no identity", () => {
  it.each([
    ["searchAll", () => searchAll("iot")],
    ["searchPeople", () => searchPeople("iot")],
    ["searchProjects", () => searchProjects("iot")],
    ["getTag", () => getTag("IoT")],
    ["listTagProjects", () => listTagProjects("IoT")],
    ["listTagPeople", () => listTagPeople("IoT")],
  ])("%s sends no Authorization header and never asks for the token", async (_n, call) => {
    await call();
    expect(sdk.getAccessToken).not.toHaveBeenCalled();
    expect(lastCall().headers.get("authorization")).toBeNull();
  });
});

describe("the query is encoded, not concatenated", () => {
  it("keeps C#, C++ and an ampersand in one value", async () => {
    await searchAll("C# & C++");
    expect(lastCall().url.searchParams.get("q")).toBe("C# & C++");
    await getTag("CI/CD");
    expect(lastCall().url.pathname).toBe("/v1/tags");
    expect(lastCall().url.searchParams.get("name")).toBe("CI/CD");
  });

  it("sends the cursor and the page size, and leaves out what is unset", async () => {
    await searchPeople("ml", { limit: 12, cursor: "abc" });
    const { url } = lastCall();
    expect(url.pathname).toBe("/v1/search/people");
    expect(url.searchParams.get("limit")).toBe("12");
    expect(url.searchParams.get("cursor")).toBe("abc");
    await searchProjects("ml");
    expect(lastCall().url.searchParams.has("cursor")).toBe(false);
  });
});

describe("the visitor's address (API plan D4)", () => {
  it("is forwarded with the secret when both exist", async () => {
    process.env.API_PROXY_SECRET = "s3cret";
    incoming.forwardedFor = "203.0.113.9, 10.0.0.1";
    await searchAll("ai");
    const { headers } = lastCall();
    expect(headers.get("x-client-ip")).toBe("203.0.113.9");
    expect(headers.get("x-gradfolio-proxy-secret")).toBe("s3cret");
  });

  it("sends nothing at all without the secret", async () => {
    incoming.forwardedFor = "203.0.113.9";
    await searchAll("ai");
    expect(lastCall().headers.get("x-client-ip")).toBeNull();
    expect(lastCall().headers.get("x-gradfolio-proxy-secret")).toBeNull();
  });

  it("never sends the secret without an address, or with one that is not an address", async () => {
    expect(await forwardedClientHeaders({ API_PROXY_SECRET: "s3cret" })).toEqual({});
    incoming.forwardedFor = "<script>";
    expect(await forwardedClientHeaders({ API_PROXY_SECRET: "s3cret" })).toEqual({});
  });

  it("is not added to calls that carry a user's token", async () => {
    process.env.API_PROXY_SECRET = "s3cret";
    incoming.forwardedFor = "203.0.113.9";
    const { getMe } = await import("./client");
    fetchMock.mockResolvedValue(json(200, { id: "x" }));
    await getMe();
    expect(lastCall().headers.get("x-gradfolio-proxy-secret")).toBeNull();
    expect(lastCall().headers.get("authorization")).toBe("Bearer user-token");
  });
});

describe("errors", () => {
  it("a 404 for an unknown tag is an ApiError with the API's code", async () => {
    fetchMock.mockResolvedValue(json(404, { code: "NOT_FOUND", message: "no" }));
    await expect(getTag("nothing")).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
    await expect(getTag("nothing")).rejects.toBeInstanceOf(ApiError);
  });
});
