import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The bell (docs/m5-plan.md §5, §9).
 *
 * Part 1 runs in CI with no login: the routes behind the bell answer 401 without a session
 * (and do not redirect a `fetch` to the login page), and a visitor sees no bell.
 *
 * Part 2 needs a logged-in browser. Nothing here signs in or holds a credential: Levon logs in
 * once per account in a headed browser and saves the session with Playwright's storageState to
 * a file OUTSIDE the repo (it is a secret), then:
 *
 *   E2E_STORAGE_STATE_A=/path/a.json PLAYWRIGHT_BASE_URL=http://localhost:3011 npm run e2e -- notifications
 *
 * Without the variable the logged-in tests are skipped.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const LANGUAGES = ["en", "ru", "am"] as const;
const THEMES = ["light", "dark"] as const;
const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

test.describe("without a session", () => {
  for (const path of ["/api/notifications", "/api/notifications/unread-count"]) {
    test(`GET ${path} answers 401 with a code, uncached, and does not redirect`, async ({
      request,
    }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(401);
      expect(response.headers()["cache-control"]).toBe("no-store");
      expect(await response.json()).toEqual({ code: "UNAUTHENTICATED" });
    });
  }

  test("a visitor sees no bell in any navigation variant", async ({ page }) => {
    for (const { width, height } of WIDTHS) {
      await page.setViewportSize({ width, height });
      await page.goto("/settings");
      await expect(page.getByTestId("bell-button")).toHaveCount(0);
      await expect(page.getByTestId("bell-button-phone")).toHaveCount(0);
    }
  });

  test("a visitor's pages never ask for the unread count", async ({ page }) => {
    const asked: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/notifications")) asked.push(r.url());
    });
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    expect(asked).toEqual([]);
  });
});

/** Waits for CSS transitions (MUI fades dialogs in): axe and screenshots of a half-faded dialog lie. */
const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))),
  );

/** Next's dev-only hint about the brand logo; the production build never prints it. */
const DEV_ONLY = /was detected as the Largest Contentful Paint/;

const stateA = process.env.E2E_STORAGE_STATE_A;

test.describe("signed in (account A)", () => {
  test.skip(!stateA, "set E2E_STORAGE_STATE_A to a storageState file kept outside the repo");
  test.use({ storageState: stateA });

  const problems = (page: Page): string[] => {
    const found: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") {
        if (!m.text().startsWith("Failed to load resource") && !DEV_ONLY.test(m.text()))
          found.push(m.text());
      }
    });
    page.on("pageerror", (e) => found.push(`pageerror: ${e.message}`));
    return found;
  };

  const seriousAxe = async (page: Page) =>
    (await new AxeBuilder({ page }).analyze()).violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.nodes.length})`);

  /** The visible bell for this width: the sidebar's, or the phone's inside More. */
  async function openBell(page: Page, phone: boolean) {
    if (phone) {
      await page.getByRole("button", { name: /^(More|Ещё|Ավելին)/ }).click();
      await page.getByTestId("bell-button-phone").click();
    } else {
      await page.getByTestId("bell-button").and(page.locator(":visible")).click();
    }
    return page.getByRole("dialog", { name: /./ }).last();
  }

  for (const language of LANGUAGES)
    for (const theme of THEMES)
      for (const size of WIDTHS) {
        test(`${language} ${theme} ${size.name}: panel screenshots, axe, clean console`, async ({
          page,
        }, testInfo) => {
          await page.context().addCookies([
            { name: "language", value: language, url: BASE },
            { name: "theme", value: theme, url: BASE },
          ]);
          await page.setViewportSize({ width: size.width, height: size.height });
          const found = problems(page);
          await page.goto("/account");
          const closed = await page.screenshot();
          await testInfo.attach("closed", { body: closed, contentType: "image/png" });
          const dialog = await openBell(page, size.name === "phone");
          await expect(dialog).toBeVisible();
          await page.waitForLoadState("networkidle");
          await settled(page);
          await testInfo.attach("open", {
            body: await page.screenshot(),
            contentType: "image/png",
          });
          expect(await seriousAxe(page)).toEqual([]);
          expect(found).toEqual([]);
        });
      }

  test("keyboard only: Tab to the bell, open, focus stays inside, Escape returns to the bell", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/account");
    const bell = page.getByTestId("bell-button").and(page.locator(":visible"));
    await bell.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: /./ }).last();
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(bell).toBeFocused();
  });

  test("the badge matches the API's count and drops by one when a row is marked read", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/account");
    const bell = page.getByTestId("bell-button").and(page.locator(":visible"));
    const api = async () =>
      (
        (await (await page.request.get("/api/notifications/unread-count")).json()) as {
          count: number;
        }
      ).count;
    const before = await api();
    test.skip(before === 0, "account A has no unread notification to mark");
    await expect(bell).toHaveAccessibleName(new RegExp(String(before > 99 ? "99+" : before)));
    await bell.click();
    await page
      .getByRole("button", { name: /^(Mark as read|Отметить прочитанным|Նշել կարդացված)/ })
      .first()
      .click();
    await expect.poll(api).toBe(before - 1);
    await expect(bell).toHaveAccessibleName(
      new RegExp(before - 1 === 0 ? "^[^0-9]+$" : String(before - 1)),
    );
  });
});
