import AxeBuilder from "@axe-core/playwright";
import { generateSessionCookie } from "@auth0/nextjs-auth0/testing";
import { expect, test, type Page } from "@playwright/test";

/**
 * The integrations page and GitHub connect (docs/m7-plan.md sections 3 and 15.1). Logged in
 * without a login: the specs mint a session cookie with the SDK's own encryption and the e2e
 * job's throwaway `AUTH0_SECRET` (playwright.config.ts). Its access token is only a scenario
 * name for the API stub (e2e/fixtures/api-stub.ts). No credential is real, and none leaves the
 * test. Real GitHub and Auth0 are exercised in the verification record, not here.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const LANGUAGES = ["en", "ru", "am"] as const;
const THEMES = ["light", "dark"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

let counter = 0;
/** A session whose access token names a stub scenario; unique per call so state never leaks. */
async function signIn(page: Page, scenario: string, language = "en", theme = "light") {
  const token = `${scenario}-${Date.now()}-${(counter += 1)}`;
  const now = Math.floor(Date.now() / 1000);
  const value = await generateSessionCookie(
    {
      user: { sub: "auth0|e2e", name: "Ani Petrosyan", email: "ani@example.com" },
      tokenSet: { accessToken: token, expiresAt: now + 3600 },
      internal: { sid: "e2e-sid", createdAt: now },
    },
    { secret: SECRET },
  );
  await page.context().addCookies([
    { name: "__session", value, url: BASE },
    { name: "language", value: language, url: BASE },
    { name: "theme", value: theme, url: BASE },
  ]);
}

const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))),
  );

const IGNORED = [/\/_vercel\//, /was detected as the Largest Contentful Paint/];
function watch(page: Page): string[] {
  const found: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    if (m.text().startsWith("Failed to load resource")) return;
    if (IGNORED.some((re) => re.test(m.text()))) return;
    found.push(m.text());
  });
  page.on("pageerror", (e) => found.push(`pageerror: ${e.message}`));
  return found;
}

async function trackShift(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as Array<{
        value: number;
        hadRecentInput: boolean;
      }>) {
        if (!e.hadRecentInput) w.__cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
}
const shift = (page: Page) => page.evaluate(() => (window as unknown as { __cls: number }).__cls);

const seriousAxe = async (page: Page) =>
  (await new AxeBuilder({ page }).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.nodes.length})`);

const VIEWS = [
  { name: "not connected", scenario: "e2e-off", path: "/integrations" },
  { name: "connected", scenario: "e2e-on", path: "/integrations" },
  { name: "not configured", scenario: "e2e-unavailable", path: "/integrations" },
  { name: "load failed", scenario: "e2e-down", path: "/integrations" },
  { name: "setup steps", scenario: "e2e-off", path: "/integrations/connections" },
] as const;

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      test.describe(`${language} ${theme} ${size.name}`, () => {
        test.use({ viewport: { width: size.width, height: size.height } });

        for (const view of VIEWS) {
          test(`${view.name}: axe, clean console, no layout shift`, async ({ page }) => {
            await signIn(page, view.scenario, language, theme);
            const problems = watch(page);
            await trackShift(page);
            const response = await page.goto(view.path, { waitUntil: "networkidle" });
            expect(response?.status()).toBe(200);
            await expect(page.locator("main")).toBeVisible();
            await settled(page);
            await page.waitForTimeout(300);
            expect(await seriousAxe(page)).toEqual([]);
            expect(await shift(page)).toBeLessThan(0.1);
            expect(problems).toEqual([]);
            // No horizontal scroll on the phone.
            const overflow = await page.evaluate(
              () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            );
            expect(overflow).toBeLessThanOrEqual(0);
          });
        }
      });
    }
  }
}

test.describe("behaviour", () => {
  test("a failed load is an error with Retry, never 'Not connected'", async ({ page }) => {
    await signIn(page, "e2e-down");
    await page.goto("/integrations");
    await expect(page.getByText("Integrations could not be loaded")).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(page.getByText("Not connected")).toHaveCount(0);
  });

  test("Connect leaves for Auth0's GitHub sign-in with the nonce, and sets state in an HttpOnly cookie", async ({
    page,
  }) => {
    await signIn(page, "e2e-off");
    let target: URL | null = null;
    await page.route("https://e2e.example.auth0.com/**", async (route) => {
      target = new URL(route.request().url());
      await route.fulfill({ status: 200, contentType: "text/html", body: "<h1>auth0</h1>" });
    });
    await page.goto("/integrations");
    await page.getByRole("button", { name: "Connect" }).click();
    await expect.poll(() => target?.pathname).toBe("/authorize");
    const t = target as unknown as URL;
    expect(t.searchParams.get("connection")).toBe("github");
    expect(t.searchParams.get("nonce")).toBe("stub-nonce");
    expect(t.searchParams.get("prompt")).toBe("login");
    expect(t.searchParams.get("redirect_uri")).toBe(`${BASE}/integrations/github/callback`);
    const cookie = (await page.context().cookies()).find((c) => c.name === "gh_link_state");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.value).toBe(t.searchParams.get("state"));
  });

  test("disconnect asks first, then the card reads Not connected", async ({ page }) => {
    await signIn(page, "e2e-on");
    await page.goto("/integrations");
    await expect(page.getByText("Connected as ani-p")).toBeVisible();
    await page.getByRole("button", { name: "Disconnect" }).click();
    const dialog = page.getByRole("dialog", { name: "Disconnect GitHub?" });
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Disconnect" }).click();
    await expect(page.getByText("GitHub is disconnected.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect" })).toBeVisible();
    await expect(page.getByText("Connected as ani-p")).toHaveCount(0);
  });

  test("an unconfirmed revocation is shown as unsettled, the card follows the API, and a retry is told to wait", async ({
    page,
  }) => {
    await signIn(page, "e2e-on502");
    await page.goto("/integrations");
    await page.getByRole("button", { name: "Disconnect" }).click();
    await page
      .getByRole("dialog", { name: "Disconnect GitHub?" })
      .getByRole("button", { name: "Disconnect" })
      .click();
    const alert = page.getByRole("alert").filter({ hasText: "did not confirm" });
    await expect(alert).toContainText("may or may not have been removed");
    // The page refreshed itself: the API already says not connected.
    await expect(page.getByRole("button", { name: "Connect" })).toBeVisible();
    await expect(page.getByText("Connected as ani-p")).toHaveCount(0);
  });

  test("the return hint shows success only when the status agrees, then cleans the URL", async ({
    page,
  }) => {
    await signIn(page, "e2e-on");
    await page.goto("/integrations?github=connected");
    await expect(page.getByText("GitHub is connected.")).toBeVisible();
    await expect(page).toHaveURL(`${BASE}/integrations`);
  });

  test("a forged success link on a disconnected account claims nothing", async ({ page }) => {
    await signIn(page, "e2e-off");
    await page.goto("/integrations?github=connected");
    await expect(page).toHaveURL(`${BASE}/integrations`);
    await expect(page.getByText("GitHub is connected.")).toHaveCount(0);
    await expect(page.getByText("Not connected").first()).toBeVisible();
  });

  test("a returned error is a fixed message; text in the URL is never shown", async ({ page }) => {
    await signIn(page, "e2e-off");
    await page.goto("/integrations?github=error&reason=GITHUB_ACCOUNT_IN_USE");
    await expect(
      page.getByRole("alert").filter({ hasText: "already belongs to another Gradfolio account" }),
    ).toBeVisible();
    await page.goto("/integrations?github=error&reason=%3Cb%3Eprize%3C%2Fb%3E");
    await expect(page.getByRole("alert").filter({ hasText: "Something went wrong" })).toBeVisible();
    await expect(page.getByText("prize")).toHaveCount(0);
  });

  test("the callback refuses a state that is not this browser's", async ({ page }) => {
    await signIn(page, "e2e-off");
    await page.goto("/integrations/github/callback?code=abc&state=forged");
    await expect(page).toHaveURL(`${BASE}/integrations`);
    await expect(
      page.getByRole("alert").filter({ hasText: "did not start from this browser" }),
    ).toBeVisible();
  });

  test("the callback needs a session", async ({ request }) => {
    const response = await request.get("/integrations/github/callback?code=a&state=b", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/auth/login");
  });
});
