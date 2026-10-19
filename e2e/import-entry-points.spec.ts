import AxeBuilder from "@axe-core/playwright";
import { generateSessionCookie } from "@auth0/nextjs-auth0/testing";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * The import dialog's entry points (M7-T31): right after GitHub connects, and Projects → Add.
 * Logged in by a minted session against the API stub. The callback's own exchange with Auth0
 * is covered by its route test; here the browser arrives where the callback sends it
 * (`/integrations?github=connected&import=1`) and the page must trust only the API.
 */
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const STUB = `http://127.0.0.1:${process.env.E2E_API_PORT ?? 3199}`;
const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const LANGUAGES = ["en", "ru", "am"] as const;
const THEMES = ["light", "dark"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;
const ADD = /^(New Project|Новый проект|Նոր նախագիծ)$/;
const IMPORT_ITEM = /Import from GitHub|Импорт из GitHub|Ներմուծել GitHub-ից/;
const NOT_NOW = /Not now|Не сейчас|Ոչ հիմա/;

let n = 0;
let currentToken = "";
async function signIn(page: Page, scenario: string, language = "en", theme = "light") {
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
  currentToken = token;
  await page.context().addCookies([
    { name: "__session", value, url: BASE },
    { name: "language", value: language, url: BASE },
    { name: "theme", value: theme, url: BASE },
  ]);
}

const settled = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))).then(
              () => resolve(),
            ),
          ),
        ),
      ),
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

const seriousAxe = async (page: Page) =>
  (await new AxeBuilder({ page }).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `${v.id} (${v.nodes.length}) ${v.nodes.map((x) => x.html.slice(0, 100) + " " + (x.any[0]?.message ?? "")).join(" | ")}`,
    );
const expectCleanAxe = (page: Page) =>
  expect.poll(() => seriousAxe(page), { timeout: 4000, intervals: [100, 250, 500] }).toEqual([]);

async function apiCalls(request: APIRequestContext) {
  const all = (await (await request.get(`${STUB}/__requests`)).json()) as Array<{
    method?: string;
    path: string;
    headers: { authorization?: string };
  }>;
  return all
    .filter((r) => r.headers.authorization === `Bearer ${currentToken}`)
    .map((r) => `${r.method} ${r.path}`);
}

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      test.describe(`${language} ${theme} ${size.name}`, () => {
        test.use({ viewport: { width: size.width, height: size.height } });

        test("after connect: the dialog is open on the repos, axe, clean console", async ({
          page,
        }) => {
          const problems = watch(page);
          await signIn(page, "e2e-on", language, theme);
          await page.goto("/integrations?github=connected&import=1");
          const dialog = page.getByRole("dialog");
          await expect(dialog).toBeVisible();
          await expect(dialog.getByRole("checkbox").first()).toBeAttached();
          await page.mouse.move(0, 0);
          await settled(page);
          await page.waitForTimeout(250);
          await expectCleanAxe(page);
          expect(problems).toEqual([]);
        });

        test("Projects → Add, connected: the two choices, axe, clean console", async ({ page }) => {
          const problems = watch(page);
          await signIn(page, "e2e-on", language, theme);
          await page.goto("/projects");
          await page.getByRole("button", { name: ADD }).click();
          await expect(page.getByRole("menu")).toBeVisible();
          await expect(page.getByRole("menuitem")).toHaveCount(2);
          await page.mouse.move(0, 0);
          await settled(page);
          await expectCleanAxe(page);
          expect(problems).toEqual([]);
        });

        test("Projects → Add, not connected: the form link and the connect link, axe", async ({
          page,
        }) => {
          const problems = watch(page);
          await signIn(page, "e2e-off", language, theme);
          await page.goto("/projects");
          await expect(page.getByRole("link", { name: ADD })).toHaveAttribute(
            "href",
            "/projects/new",
          );
          await expect(page.getByRole("link", { name: /GitHub/ }).first()).toHaveAttribute(
            "href",
            "/integrations",
          );
          await page.mouse.move(0, 0);
          await settled(page);
          await expectCleanAxe(page);
          expect(problems).toEqual([]);
        });
      });
    }
  }
}

test.describe("after connect", () => {
  test("connect → dialog → review → save creates drafts; the hint leaves the URL", async ({
    page,
    request,
  }) => {
    await signIn(page, "e2e-on");
    await page.goto("/integrations?github=connected&import=1");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Nothing is imported by opening it.
    expect(
      (await apiCalls(request)).filter((c) => c.includes("POST /v1/me/github/import")),
    ).toEqual([]);
    await dialog.getByRole("checkbox").first().check();
    await dialog.getByRole("button", { name: "Continue" }).click();
    await dialog.getByRole("button", { name: "Save as drafts" }).click();
    await expect(dialog.getByRole("link").first()).toBeVisible();
    expect(await apiCalls(request)).toContain("POST /v1/me/github/import");
    await expect.poll(() => new URL(page.url()).search).toBe("");
  });

  test("Not now closes it, imports nothing and focus returns to the Import button", async ({
    page,
    request,
  }) => {
    await signIn(page, "e2e-on");
    await page.goto("/integrations?github=connected&import=1");
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: NOT_NOW }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: IMPORT_ITEM })).toBeFocused();
    expect((await apiCalls(request)).filter((c) => c.includes("POST /v1/me/github"))).toEqual([]);
  });

  test("Escape closes it", async ({ page }) => {
    await signIn(page, "e2e-on");
    await page.goto("/integrations?github=connected&import=1");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("a forged hint on an account that is not connected opens nothing and asks GitHub for nothing", async ({
    page,
    request,
  }) => {
    await signIn(page, "e2e-off");
    await page.goto("/integrations?github=connected&import=1");
    await expect(page.getByText("Not connected").first()).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect((await apiCalls(request)).filter((c) => c.includes("/v1/me/github"))).toEqual([]);
  });

  test("the onboarding stepper opens it too", async ({ page }) => {
    await signIn(page, "e2e-on");
    await page.goto("/integrations/connections?github=connected&import=1");
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("Projects → Add", () => {
  test("Create manually goes to the form", async ({ page }) => {
    await signIn(page, "e2e-on");
    await page.goto("/projects");
    await page.getByRole("button", { name: ADD }).click();
    await page.getByRole("menuitem", { name: "Create manually" }).click();
    await expect(page).toHaveURL(/\/projects\/new$/);
  });

  test("Import from GitHub opens the dialog; Escape returns focus to Add; nothing imported", async ({
    page,
    request,
  }) => {
    await signIn(page, "e2e-on");
    await page.goto("/projects");
    const add = page.getByRole("button", { name: ADD });
    await add.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("menuitem", { name: IMPORT_ITEM }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("checkbox").first()).toBeAttached();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(add).toBeFocused();
    expect((await apiCalls(request)).filter((c) => c.includes("POST /v1/me/github"))).toEqual([]);
  });

  test("not connected: Add is the plain link and the connect link goes to the integrations", async ({
    page,
  }) => {
    await signIn(page, "e2e-off");
    await page.goto("/projects");
    await expect(page.getByRole("button", { name: ADD })).toHaveCount(0);
    await page.getByRole("link", { name: "Connect GitHub to import repos" }).click();
    await expect(page).toHaveURL(/\/integrations$/);
  });
});
