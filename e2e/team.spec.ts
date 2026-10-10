import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The team section (docs/m5-plan.md section 4 and 9).
 *
 * Part 1 runs in CI with no login: the user lookup route refuses a bad query and a missing
 * session. Part 2 needs logged-in browsers and a project of account A, and is skipped without
 * them. Nothing here signs in or holds a credential: Levon logs in once per account in a headed
 * browser and saves Playwright's storageState OUTSIDE the repo (it is a secret):
 *
 *   E2E_STORAGE_STATE_A=/path/a.json E2E_STORAGE_STATE_B=/path/b.json \
 *   E2E_PROJECT_ID=<a project of A> PLAYWRIGHT_BASE_URL=http://localhost:3011 npm run e2e -- team
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const LANGUAGES = ["en", "ru", "am"] as const;
const THEMES = ["light", "dark"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

test.describe("without a session", () => {
  test("the lookup refuses a short query (400) and a missing session (401), uncached", async ({
    request,
  }) => {
    const short = await request.get("/api/users/lookup?q=An", { maxRedirects: 0 });
    expect(short.status()).toBe(400);
    expect(await short.json()).toEqual({ code: "VALIDATION_FAILED" });
    const anonymous = await request.get("/api/users/lookup?q=Ani", { maxRedirects: 0 });
    expect(anonymous.status()).toBe(401);
    expect(anonymous.headers()["cache-control"]).toBe("no-store");
    expect(await anonymous.json()).toEqual({ code: "UNAUTHENTICATED" });
  });
});

const stateA = process.env.E2E_STORAGE_STATE_A;
const stateB = process.env.E2E_STORAGE_STATE_B;
const projectId = process.env.E2E_PROJECT_ID;

const consoleProblems = (page: Page): string[] => {
  const found: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") found.push(m.text());
  });
  page.on("pageerror", (e) => found.push(`pageerror: ${e.message}`));
  return found;
};
const seriousAxe = async (page: Page) =>
  (await new AxeBuilder({ page }).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.nodes.length})`);

const CANCEL = { en: "Cancel", ru: "Отмена", am: "Չեղարկել" } as const;

test.describe("owner (account A)", () => {
  test.skip(!stateA || !projectId, "set E2E_STORAGE_STATE_A and E2E_PROJECT_ID");
  test.use({ storageState: stateA });

  for (const language of LANGUAGES)
    for (const theme of THEMES)
      for (const size of SIZES) {
        test(`${language} ${theme} ${size.name}: team, add dialog, and the remove confirm`, async ({
          page,
        }, testInfo) => {
          await page.context().addCookies([
            { name: "language", value: language, url: BASE },
            { name: "theme", value: theme, url: BASE },
          ]);
          await page.setViewportSize({ width: size.width, height: size.height });
          const found = consoleProblems(page);
          await page.goto(`/projects/${projectId}`);
          await testInfo.attach("page", {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
          expect(await seriousAxe(page)).toEqual([]);
          // The add dialog, both tabs.
          await page
            .getByRole("button", { name: /^(Add teammate|Добавить участника|Ավելացնել անդամ)/ })
            .click();
          const dialog = page.getByRole("dialog");
          await expect(dialog).toBeVisible();
          await testInfo.attach("add-find", {
            body: await page.screenshot(),
            contentType: "image/png",
          });
          expect(await seriousAxe(page)).toEqual([]);
          await dialog.getByRole("tab").nth(1).click();
          await testInfo.attach("add-external", {
            body: await page.screenshot(),
            contentType: "image/png",
          });
          expect(await seriousAxe(page)).toEqual([]);
          await page.keyboard.press("Escape");
          await expect(dialog).toBeHidden();
          // The remove (or cancel-invitation) confirmation. The project must have a team row:
          // an empty team would silently skip this step, so it fails loudly instead.
          const removers = page.getByRole("button", {
            name: /^(Remove|Cancel the invitation|Убрать|Отозвать|Հեռացնել|Չեղարկել հրավերը)/,
          });
          expect(
            await removers.count(),
            "E2E_PROJECT_ID needs at least one team row (invite or add a name first)",
          ).toBeGreaterThan(0);
          await removers.first().click();
          const confirm = page.getByRole("dialog");
          await expect(confirm).toBeVisible();
          // Cancel itself has the focus, so Enter cannot remove by accident.
          await expect(
            confirm.getByRole("button", { name: CANCEL[language], exact: true }),
          ).toBeFocused();
          await testInfo.attach("confirm", {
            body: await page.screenshot(),
            contentType: "image/png",
          });
          expect(await seriousAxe(page)).toEqual([]);
          await page.keyboard.press("Escape");
          await expect(confirm).toBeHidden();
          expect(found).toEqual([]);
        });
      }

  test("keyboard only: open Add, focus stays inside, Escape returns focus to the button", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/projects/${projectId}`);
    const add = page.getByRole("button", { name: "Add teammate" });
    await add.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(add).toBeFocused();
  });
});

test.describe("not the owner (account B)", () => {
  test.skip(!stateB || !projectId, "set E2E_STORAGE_STATE_B and E2E_PROJECT_ID");
  test.use({ storageState: stateB });

  test("sees no team controls on A's project, or the project is a 404", async ({ page }) => {
    const response = await page.goto(`/projects/${projectId}`);
    if (response?.status() === 404) return; // private and not invited: the API's 404
    await expect(
      page.getByRole("button", { name: /Add teammate|Remove|Cancel the invitation/ }),
    ).toHaveCount(0);
  });
});
