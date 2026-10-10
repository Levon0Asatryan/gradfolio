import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The teams page, `/teams` (docs/m5-plan.md section 13).
 *
 * Part 1 runs in CI with no login: the page needs one. Part 2 needs logged-in browsers (Levon logs in
 * headed once per account and saves Playwright's storageState OUTSIDE the repo, a secret) and is
 * skipped without them:
 *
 *   E2E_STORAGE_STATE_A=/path/a.json PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run e2e -- teams
 *
 * The matrix checks whatever the account has (empty states included); the invitation journey that
 * fills the lists is in docs/m5-verification.md.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const LANGUAGES = ["en", "ru", "am"] as const;
const THEMES = ["light", "dark"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

/** Waits for CSS transitions: axe on a half-faded dialog reports false contrast failures. */
const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))),
  );

/** Next's dev-only hint about the brand logo; the production build never prints it. */
const DEV_ONLY = /was detected as the Largest Contentful Paint/;

const consoleProblems = (page: Page): string[] => {
  const found: string[] = [];
  page.on("console", (m) => {
    if (
      (m.type() === "error" || m.type() === "warning") &&
      !m.text().startsWith("Failed to load resource") &&
      !DEV_ONLY.test(m.text())
    )
      found.push(m.text());
  });
  page.on("pageerror", (e) => found.push(`pageerror: ${e.message}`));
  return found;
};
const seriousAxe = async (page: Page) =>
  (await new AxeBuilder({ page }).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.nodes.length})`);

test("without a session /teams is a redirect to login that keeps the way back", async ({
  request,
}) => {
  const response = await request.get("/teams", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  const location = response.headers().location ?? "";
  expect(location).toContain("/auth/login");
  expect(new URL(location, "http://x").searchParams.get("returnTo")).toBe("/teams");
});

const stateA = process.env.E2E_STORAGE_STATE_A;

test.describe("signed in (account A)", () => {
  test.skip(!stateA, "set E2E_STORAGE_STATE_A to a storageState file kept outside the repo");
  test.use({ storageState: stateA });

  for (const language of LANGUAGES)
    for (const theme of THEMES)
      for (const size of SIZES) {
        test(`${language} ${theme} ${size.name}: page, axe, clean console`, async ({
          page,
        }, testInfo) => {
          await page.context().addCookies([
            { name: "language", value: language, url: BASE },
            { name: "theme", value: theme, url: BASE },
          ]);
          await page.setViewportSize({ width: size.width, height: size.height });
          const found = consoleProblems(page);
          await page.goto("/teams");
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await settled(page);
          await testInfo.attach("teams", {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
          expect(await seriousAxe(page)).toEqual([]);
          expect(found).toEqual([]);
        });
      }

  test("the nav has a labelled Teams item in the sidebar, the rail and under More on a phone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/settings");
    await expect(page.getByRole("link", { name: "Teams" }).first()).toHaveAttribute(
      "href",
      "/teams",
    );
    await page.setViewportSize({ width: 800, height: 700 }); // the rail
    await expect(page.getByRole("link", { name: "Teams" }).first()).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: /^More/ }).click();
    await expect(
      page.getByRole("dialog", { name: "More" }).getByRole("link", { name: "Teams" }),
    ).toHaveAttribute("href", "/teams");
  });

  test("keyboard only: Tab reaches the page's controls and focus is a keyboard focus (:focus-visible)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/teams");
    await page.getByRole("heading", { level: 1 }).waitFor();
    const seen = new Set<string>();
    // Past the navigation: the page's own controls (the nav is covered by its own tests).
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement | null;
        if (!e || e === document.body || !e.closest("main")) return null;
        return {
          label: e.getAttribute("aria-label") || (e.textContent || "").trim().slice(0, 40),
          visible: e.matches(":focus-visible"),
        };
      });
      if (info?.label) seen.add(info.label);
      // The ring itself is the theme's job (and its own test); here: keyboard focus moves to controls.
      if (info) expect(info.visible, `keyboard focus on "${info.label}"`).toBe(true);
    }
    expect(seen.size, "controls of the page that were focused").toBeGreaterThan(0);
  });
});
