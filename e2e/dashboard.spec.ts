import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The dashboard, `/` (docs/m6-plan.md section 6). Part 1 runs in CI with no login. Part 2 needs
 * a logged-in browser (Levon logs in headed once and saves Playwright's storageState OUTSIDE
 * the repo, a secret) and is skipped without it:
 *
 *   E2E_STORAGE_STATE_A=/path/a.json PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run e2e -- dashboard
 *
 * The matrix checks whatever the account has (empty states included). Whether the numbers
 * equal the API's for the test account is checked in the verification record, against the
 * API (`GET /v1/me/dashboard`), not here.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const LANGUAGES = ["en", "ru", "am"] as const;
const THEMES = ["light", "dark"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))),
  );
const DEV_ONLY = /was detected as the Largest Contentful Paint/;
const consoleProblems = (page: Page): string[] => {
  const found: string[] = [];
  page.on("console", (m) => {
    if ((m.type() === "error" || m.type() === "warning") && !DEV_ONLY.test(m.text()))
      found.push(m.text());
  });
  page.on("pageerror", (e) => found.push(`pageerror: ${e.message}`));
  return found;
};
const seriousAxe = async (page: Page) =>
  (await new AxeBuilder({ page }).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.nodes.length})`);

test("without a session the dashboard is a redirect to login that keeps the way back", async ({
  request,
}) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  const location = response.headers().location ?? "";
  expect(location).toContain("/auth/login");
  expect(new URL(location, "http://x").searchParams.get("returnTo")).toBe("/");
});

const stateA = process.env.E2E_STORAGE_STATE_A;

test.describe("signed in (account A)", () => {
  test.skip(!stateA, "set E2E_STORAGE_STATE_A to a storageState file kept outside the repo");
  test.use({ storageState: stateA });

  for (const language of LANGUAGES)
    for (const theme of THEMES)
      for (const size of SIZES) {
        test(`${language} ${theme} ${size.name}: page, axe, clean console, no mock data`, async ({
          page,
        }, testInfo) => {
          await page.context().addCookies([
            { name: "language", value: language, url: BASE },
            { name: "theme", value: theme, url: BASE },
          ]);
          await page.setViewportSize({ width: size.width, height: size.height });
          const found = consoleProblems(page);
          await page.goto("/");
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await settled(page);
          // The mock's own project and feed lines must never reach a real dashboard.
          await expect(page.getByText("EcoRoute – CO₂-aware Navigation")).toHaveCount(0);
          await expect(page.getByText(/Profile viewed \d+ times/)).toHaveCount(0);
          await testInfo.attach("dashboard", {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
          expect(await seriousAxe(page)).toEqual([]);
          expect(found).toEqual([]);
        });
      }
});
