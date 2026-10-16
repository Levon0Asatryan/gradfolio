import { generateSessionCookie } from "@auth0/nextjs-auth0/testing";
import { expect, test, type Page } from "@playwright/test";

/**
 * Delete account (docs/m7-plan.md follow-up): a successful delete must end in sign-out, and
 * nothing after the delete may call `GET /v1/me`, which would create a new empty account
 * because the token is still valid. The API stub behaves like production: a token without an
 * account gets a new one on `GET /v1/me` (e2e/fixtures/api-stub.ts).
 */
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const STUB = `http://127.0.0.1:${process.env.E2E_API_PORT ?? 3199}`;
const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let n = 0;
async function signIn(page: Page, scenario: string) {
  const token = `${scenario}-${Date.now()}-${(n += 1)}`;
  const now = Math.floor(Date.now() / 1000);
  const value = await generateSessionCookie(
    {
      user: { sub: "auth0|e2e", name: "Ani Petrosyan", email: "ani@example.com" },
      tokenSet: { accessToken: token, expiresAt: now + 3600 },
      internal: { sid: "e2e-sid", createdAt: now },
    },
    { secret: SECRET },
  );
  await page.context().addCookies([{ name: "__session", value, url: BASE }]);
  return token;
}

async function apiCalls(request: import("@playwright/test").APIRequestContext, token: string) {
  const all = (await (await request.get(`${STUB}/__requests`)).json()) as Array<{
    method?: string;
    path: string;
    headers: { authorization?: string };
  }>;
  return all
    .filter((r) => r.headers.authorization === `Bearer ${token}`)
    .map((r) => `${r.method} ${r.path}`);
}

test.describe("delete account", () => {
  test("a successful delete ends at /auth/logout and calls GET /v1/me no more", async ({
    page,
    request,
  }) => {
    const token = await signIn(page, "e2e-del");
    // Do not follow the logout to Auth0: record that it was requested.
    const logouts: string[] = [];
    await page.route("**/auth/logout**", async (route) => {
      logouts.push(new URL(route.request().url()).pathname);
      await route.fulfill({ status: 200, contentType: "text/html", body: "<h1>signed out</h1>" });
    });
    await page.goto("/account");
    await expect(page.getByRole("button", { name: "Delete my account" })).toBeVisible();
    const before = (await apiCalls(request, token)).length;
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.getByRole("checkbox").check();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete account", exact: true })
      .click();
    await expect.poll(() => logouts).toEqual(["/auth/logout"]);
    const calls = (await apiCalls(request, token)).slice(before);
    const afterDelete = calls.slice(calls.indexOf("DELETE /v1/me") + 1);
    expect(calls).toContain("DELETE /v1/me");
    // Nothing may recreate the account: no read of /v1/me or anything else after the delete.
    expect(afterDelete).toEqual([]);
  });

  test("when the API says no, the dialog stays and says so; nobody is signed out", async ({
    page,
  }) => {
    await signIn(page, "e2e-delfail");
    const logouts: string[] = [];
    await page.route("**/auth/logout**", async (route) => {
      logouts.push("x");
      await route.fulfill({ status: 200, body: "" });
    });
    await page.goto("/account");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.getByRole("checkbox").check();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete account", exact: true })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "your account was not deleted",
    );
    expect(logouts).toEqual([]);
  });
});
