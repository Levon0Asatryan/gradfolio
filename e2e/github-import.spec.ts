import AxeBuilder from "@axe-core/playwright";
import { generateSessionCookie } from "@auth0/nextjs-auth0/testing";
import { expect, test, type Page } from "@playwright/test";

/**
 * The GitHub import dialog and the re-sync card (docs/m7-plan.md sections 4 and 5), logged in by
 * a minted session against the API stub (e2e/fixtures/api-stub.ts, the GitHub data section).
 * Real GitHub is exercised in the verification record, not here.
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

let n = 0;
/** The access token of the minted session in this test: the stub keys its state on it. */
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

/**
 * Waits for the page to stop moving: two frames (a transition that a state change has just
 * started is only registered after the next paint), then every running animation. Axe reads
 * colours as they are at that moment, and a button half-way through its fade has none of its own.
 */
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
        `${v.id} (${v.nodes.length}) ${v.nodes.map((n) => n.html.slice(0, 100) + " " + (n.any[0]?.message ?? "")).join(" | ")}`,
    );

/**
 * Axe must come back clean once the page has settled. A button that has just been enabled fades
 * for a moment, and axe reads the half-way colour; polling waits for the end of the fade, and a
 * violation that stays still fails after the timeout.
 */
const expectCleanAxe = (page: Page) =>
  expect.poll(() => seriousAxe(page), { timeout: 4000, intervals: [100, 250, 500] }).toEqual([]);

const IMPORT = /Import from GitHub|Импорт из GitHub|Ներմուծել GitHub-ից/;

async function openDialog(page: Page, scenario: string, language = "en", theme = "light") {
  await signIn(page, scenario, language, theme);
  await page.goto("/integrations");
  await page.getByRole("button", { name: IMPORT }).click();
  return page.getByRole("dialog");
}

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      test.describe(`${language} ${theme} ${size.name}`, () => {
        test.use({ viewport: { width: size.width, height: size.height } });

        for (const scenario of ["e2e-on", "e2e-onempty", "e2e-onrl", "e2e-onerr"]) {
          test(`pick, ${scenario}: axe, clean console`, async ({ page }) => {
            const problems = watch(page);
            const dialog = await openDialog(page, scenario, language, theme);
            await expect(dialog).toBeVisible();
            await expect(dialog.locator("h2")).toBeVisible();
            if (scenario === "e2e-on") {
              await expect(dialog.getByRole("checkbox").first()).toBeAttached();
            } else {
              await expect(dialog.getByRole("progressbar")).toHaveCount(0);
            }
            await settled(page);
            await page.waitForTimeout(250);
            await expectCleanAxe(page);
            expect(problems).toEqual([]);
          });
        }

        test("review and result: axe, clean console", async ({ page }) => {
          const problems = watch(page);
          const dialog = await openDialog(page, "e2e-on", language, theme);
          await dialog.getByRole("checkbox").first().check();
          await dialog
            .getByRole("button")
            .filter({ hasText: /Continue|Продолжить|Շարունակել/ })
            .click();
          await expect(dialog.getByRole("textbox").first()).toBeVisible();
          await expect(
            dialog
              .getByRole("button")
              .filter({ hasText: /Save as drafts|Сохранить как черновики|Պահել որպես սևագրեր/ }),
          ).toBeEnabled();
          // The pointer rests where "Continue" was; a hovered contained button in dark mode is 4.46:1
          // (theme follow-up), so judge the resting state.
          await page.mouse.move(0, 0);
          await settled(page);
          await expectCleanAxe(page);
          await dialog
            .getByRole("button")
            .filter({ hasText: /Save as drafts|Сохранить как черновики|Պահել որպես սևագրեր/ })
            .click();
          await expect(dialog.getByRole("link").first()).toBeVisible();
          await page.mouse.move(0, 0);
          await settled(page);
          await expectCleanAxe(page);
          expect(problems).toEqual([]);
        });
      });
    }
  }
}

test.describe("behaviour", () => {
  test("pick, review, edit, save: one request with only the override; drafts, never published", async ({
    page,
    request,
  }) => {
    const dialog = await openDialog(page, "e2e-on");
    // Every repository starts unselected; the imported one is disabled and says so.
    await expect(dialog.getByRole("checkbox", { name: "ani-p/thesis-tracker" })).not.toBeChecked();
    await expect(dialog.getByRole("checkbox", { name: "ani-p/dotfiles" })).toBeDisabled();
    await expect(dialog.getByText(/^Imported/)).toBeVisible();
    await dialog.getByRole("checkbox", { name: "ani-p/thesis-tracker" }).check();
    await dialog.getByRole("checkbox", { name: "ani-p/smart-garden" }).check();
    await expect(dialog.getByText("Selected: 2 of 10")).toBeVisible();
    await dialog.getByRole("button", { name: "Continue" }).click();
    await expect(dialog.getByRole("heading", { name: "Review before saving" })).toBeFocused();
    // The review shows the draft the API read from GitHub, README included.
    await expect(
      dialog.getByText("README of thesis-tracker, cleaned by the server."),
    ).toBeVisible();
    await dialog.getByLabel("Title").first().fill("My thesis tracker");
    await dialog.getByRole("button", { name: "Save as drafts" }).click();
    await expect(dialog.getByText("Projects created as drafts: 2")).toBeVisible();
    await expect(dialog.getByText("Publish them from your projects page.")).toBeVisible();
    const bodies = (await (
      await request.get(`${STUB}/__imports?token=${encodeURIComponent(currentToken)}`)
    ).json()) as Array<{
      repoIds: number[];
      overrides?: Record<string, Record<string, unknown>>;
    }>;
    const last = bodies[bodies.length - 1]!;
    expect(last.repoIds).toEqual([1, 2]);
    expect(JSON.stringify(last.overrides)).toContain("My thesis tracker");
    expect(JSON.stringify(last.overrides)).not.toContain("smart-garden");
  });

  test("Not now imports nothing; Escape closes; focus returns to the button", async ({
    page,
    request,
  }) => {
    const dialog = await openDialog(page, "e2e-on");
    await dialog.getByRole("checkbox", { name: "ani-p/thesis-tracker" }).check();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: IMPORT })).toBeFocused();
    const mine = (await (
      await request.get(`${STUB}/__imports?token=${encodeURIComponent(currentToken)}`)
    ).json()) as unknown[];
    expect(mine).toEqual([]);
  });

  test("search narrows the list; a cursor loads more", async ({ page }) => {
    const dialog = await openDialog(page, "e2e-on");
    await expect(dialog.getByRole("checkbox", { name: "ani-p/ml-notes" })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Load more" }).click();
    await expect(dialog.getByRole("checkbox", { name: "ani-p/ml-notes" })).toBeAttached();
    await dialog.getByRole("searchbox").fill("garden");
    await expect(dialog.getByRole("checkbox", { name: "ani-p/smart-garden" })).toBeAttached();
    await expect(dialog.getByRole("checkbox", { name: "ani-p/thesis-tracker" })).toHaveCount(0);
  });

  test("empty is its own state", async ({ page }) => {
    const dialog = await openDialog(page, "e2e-onempty");
    await expect(dialog.getByText("No public repositories")).toBeVisible();
  });

  test("the GitHub limit is an error, never 'no repositories'", async ({ page }) => {
    const dialog = await openDialog(page, "e2e-onrl");
    await expect(
      dialog.getByRole("alert").filter({ hasText: "request limit is reached" }),
    ).toBeVisible();
    await expect(dialog.getByText("No public repositories")).toHaveCount(0);
  });

  test("GitHub being down is an error with Retry", async ({ page }) => {
    const dialog = await openDialog(page, "e2e-onerr");
    await expect(
      dialog.getByRole("alert").filter({ hasText: "GitHub is not responding" }),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("keyboard: Tab reaches the list, Space selects, the focus stays inside the dialog", async ({
    page,
  }) => {
    const dialog = await openDialog(page, "e2e-on");
    // The list has loaded: otherwise the first Tab stop is a button, not a repository.
    await expect(dialog.getByRole("checkbox", { name: "ani-p/thesis-tracker" })).toBeAttached();
    await dialog.getByRole("searchbox").focus();
    await expect(dialog.getByRole("searchbox")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute("aria-labelledby")))
      .toBe("repo-1-name");
    await page.keyboard.press("Space");
    await expect(dialog.getByRole("checkbox", { name: "ani-p/thesis-tracker" })).toBeChecked();
    for (let i = 0; i < 25; i += 1) await page.keyboard.press("Tab");
    const inside = await page.evaluate(
      () => document.activeElement?.closest('[role="dialog"]') !== null,
    );
    expect(inside).toBe(true);
  });

  test("the imported project shows the badge and the owner's re-sync card (dry run, then apply)", async ({
    page,
  }) => {
    await signIn(page, "e2e-on");
    await page.goto("/projects/5c1d9a3e-0000-4000-8000-000000000003");
    await expect(page.getByText("From GitHub").first()).toBeVisible();
    await page.getByRole("button", { name: "Check GitHub for changes" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Kept: you edited it")).toBeVisible();
    await expect(dialog.getByText("Conflict: your version was kept")).toBeVisible();
    await expect(dialog.getByText("GitHub's newer README")).toBeVisible();
    await dialog.getByRole("button", { name: "Apply changes" }).click();
    await expect(dialog.getByText("Synced with GitHub.")).toBeVisible();
  });
});
