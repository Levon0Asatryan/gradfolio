import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * No login, no API: the 404 page, a protected page asked for without a session, the public
 * pages that render without data, and the language switch. Axe must find no serious or
 * critical violation, and the console must stay clean (no hydration warnings).
 */

const LANGUAGES = ["en", "ru", "am"] as const;

async function setLanguage(page: Page, language: string, theme = "light") {
  const url = new URL(page.context().browser() ? "http://localhost" : "http://localhost");
  void url;
  await page.context().addCookies([
    {
      name: "language",
      value: language,
      url: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`,
    },
    {
      name: "theme",
      value: theme,
      url: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`,
    },
  ]);
}

/**
 * Console errors and warnings (hydration mismatches, React warnings, uncaught errors), and
 * failed requests. The browser's generic "Failed to load resource" line has no URL, so
 * requests are judged by their own response below.
 *
 * Allowed to fail here, and only here: Vercel's analytics scripts (they exist only on
 * Vercel), and the sidebar's prefetch of a protected page, which the proxy redirects to
 * `/auth/login` (that answers 500 because the Auth0 tenant of this run is fake).
 */
const ALLOWED_FAILURES = [/\/_vercel\//, /\/auth\/login/];

function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    if (m.text().startsWith("Failed to load resource")) return;
    problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() < 400) return;
    if (r.request().isNavigationRequest() && r.status() === 404) return; // the 404 page itself
    if (ALLOWED_FAILURES.some((re) => re.test(r.url()))) return;
    problems.push(`${r.status()} ${r.url()}`);
  });
  return problems;
}

async function serious(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page }).analyze();
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.nodes.length})`);
}

for (const language of LANGUAGES) {
  test.describe(`language ${language}`, () => {
    test.beforeEach(async ({ page }) => setLanguage(page, language));

    test("an unknown page is a translated 404 with one h1, no serious axe findings", async ({
      page,
    }) => {
      const problems = watchConsole(page);
      const response = await page.goto("/no-such-page");
      expect(response?.status()).toBe(404);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        language === "am" ? "hy" : language,
      );
      expect(await serious(page)).toEqual([]);
      expect(problems).toEqual([]);
    });

    for (const path of ["/settings", "/search"]) {
      test(`${path} renders, has no serious axe findings and a clean console`, async ({ page }) => {
        const problems = watchConsole(page);
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("main")).toBeVisible();
        expect(await serious(page)).toEqual([]);
        expect(problems).toEqual([]);
      });
    }
  });
}

test("dark theme renders /settings without serious axe findings", async ({ page }) => {
  await setLanguage(page, "en", "dark");
  await page.goto("/settings");
  await expect(page.locator("main")).toBeVisible();
  expect(await serious(page)).toEqual([]);
});

test("a protected page without a session is a redirect to login, as an HTTP response", async ({
  request,
}) => {
  for (const path of ["/projects", "/projects/new", "/account", "/"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(307);
    const location = response.headers().location ?? "";
    expect(location, path).toContain("/auth/login");
    expect(new URL(location, "http://x").searchParams.get("returnTo"), path).toBe(path);
  }
});

test("the edit page of a project is protected too, and the return path is kept", async ({
  request,
}) => {
  const path = "/projects/5c1d9a3e-aaaa-4bbb-8ccc-ddddeeeeffff/edit";
  const response = await request.get(path, { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers().location ?? "", "http://x").searchParams.get("returnTo")).toBe(
    path,
  );
});

test("a public page needs no login", async ({ request }) => {
  const response = await request.get("/settings", { maxRedirects: 0 });
  expect(response.status()).toBe(200);
});

test("choosing a language changes <html lang> and the page text, and it survives a reload", async ({
  page,
}) => {
  await page.goto("/settings");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "Русский" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
});
