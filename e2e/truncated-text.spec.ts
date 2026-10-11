import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Cropped text (`TruncatedText`, docs/m7-plan.md section 15.3) on an anonymous page, so it runs
 * in CI against the API stub's `long` query: a project title (two-line clamp), its summary (three)
 * and a person's headline (two) that do not fit, beside a short title that does. At 390 and
 * 1440 wide, light and dark, en / ru / am: the cropped text shows its full text in a tooltip on
 * hover and on the card's keyboard focus, the text that fits shows none, the card keeps one tab
 * stop and one name, axe finds no serious or critical violation with the tooltips open or
 * closed, and the console is clean (no hydration message).
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const LANGUAGES = ["en", "ru", "am"] as const;
const THEMES = ["light", "dark"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

/** Vercel's analytics scripts exist only on Vercel; Next's dev-only LCP hint never prints in a build. */
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

const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))),
  );

const seriousAxe = async (page: Page) =>
  (await new AxeBuilder({ page }).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.nodes.length})`);

async function preferences(page: Page, language: string, theme: string) {
  await page.context().addCookies([
    { name: "language", value: language, url: BASE },
    { name: "theme", value: theme, url: BASE },
  ]);
}

/** The popup repeats visible text, so it is hidden from the accessibility tree: found by role attribute. */
const tooltips = (page: Page) => page.locator('[role="tooltip"]');

/** What the browser really drew: a clamped block overflows its own height. */
const isCropped = (el: Locator) => el.evaluate((node) => node.scrollHeight > node.clientHeight);

async function fullText(el: Locator) {
  const text = (await el.textContent()) ?? "";
  expect(text.length).toBeGreaterThan(0);
  return text;
}

/** Hovers, checks the tooltip says exactly what the element holds, then moves away. */
async function expectTooltipOnHover(page: Page, el: Locator) {
  const text = await fullText(el);
  await el.hover();
  await expect(tooltips(page)).toHaveText(text);
  await expect(
    tooltips(page).locator("xpath=ancestor-or-self::*[@aria-hidden='true']"),
  ).toHaveCount(1);
  await page.mouse.move(0, 0);
  await expect(tooltips(page)).toHaveCount(0);
}

async function expectNoSecondName(el: Locator) {
  for (const attr of ["aria-label", "aria-labelledby", "aria-describedby", "title", "tabindex"]) {
    await expect(el).not.toHaveAttribute(attr);
  }
}

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      test.describe(`${language} ${theme} ${size.name}`, () => {
        test.use({ viewport: { width: size.width, height: size.height } });

        test("cropped text shows its full text on hover and keyboard focus, only when cropped", async ({
          page,
        }) => {
          await preferences(page, language, theme);
          const problems = watch(page);
          const response = await page.goto("/search?q=long", { waitUntil: "networkidle" });
          expect(response?.status()).toBe(200);

          const card = page.getByRole("link", { name: /^Distributed soil moisture/ });
          const title = card.locator("h3");
          const summary = card.getByText(/^Forty sensor nodes/);
          const headline = page
            .getByRole("link", { name: /^Ani Petrosyan/ })
            .getByText(/^Embedded systems/);
          const short = page.getByRole("link", { name: "Խելացի այգի" }).locator("h3");

          expect(await isCropped(title)).toBe(true);
          expect(await isCropped(summary)).toBe(true);
          expect(await isCropped(headline)).toBe(true);
          expect(await isCropped(short)).toBe(false);

          // One name for the card, the title's own text; the tooltip adds no name, no
          // description and no tab stop inside the link.
          await expect(card).toHaveAccessibleName(await fullText(title));
          await expect(card).toHaveAccessibleDescription("");
          await expectNoSecondName(title);
          await expectNoSecondName(summary);

          await settled(page);
          expect(await seriousAxe(page)).toEqual([]);

          await expectTooltipOnHover(page, title);
          await expectTooltipOnHover(page, summary);
          await expectTooltipOnHover(page, headline);

          await short.hover();
          await page.waitForTimeout(400); // past MUI's enter delay (100 ms)
          await expect(tooltips(page)).toHaveCount(0);
          await page.mouse.move(0, 0);

          // Keyboard: Tab from the search box until the card has focus; its cropped texts open.
          await page.getByRole("combobox").focus();
          for (let i = 0; i < 20; i++) {
            await page.keyboard.press("Tab");
            if (await card.evaluate((el) => el === document.activeElement)) break;
          }
          await expect(card).toBeFocused();
          await expect(tooltips(page).filter({ hasText: await fullText(title) })).toBeVisible();
          await expect(tooltips(page).filter({ hasText: await fullText(summary) })).toBeVisible();
          await settled(page);
          expect(await seriousAxe(page)).toEqual([]);

          await page.keyboard.press("Escape");
          await expect(tooltips(page)).toHaveCount(0);
          await expect(card).toBeFocused();

          expect(problems).toEqual([]);
        });
      });
    }
  }
}
