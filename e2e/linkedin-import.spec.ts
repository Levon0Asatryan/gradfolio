import AxeBuilder from "@axe-core/playwright";
import { generateSessionCookie } from "@auth0/nextjs-auth0/testing";
import { expect, test, type Page } from "@playwright/test";

/**
 * The LinkedIn export wizard (M7-T43), logged in by a minted session against the API stub
 * (e2e/fixtures/api-stub.ts, the LinkedIn section). The browser's PUT to storage is answered by
 * `page.route`, so the ZIP is synthetic bytes that never leave the test; the proposal is invented.
 * The real export is exercised by hand on production (queue M7-T51), never here.
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
const OPEN = /Import from LinkedIn export|Импорт из архива LinkedIn|Ներմուծել LinkedIn արխիվից/;

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
        `${v.id} (${v.nodes.length}) ${v.nodes.map((n) => n.html.slice(0, 100) + " " + (n.any[0]?.message ?? "")).join(" | ")}`,
    );
const expectCleanAxe = async (page: Page) => {
  await page.mouse.move(0, 0);
  await settled(page);
  await expect
    .poll(() => seriousAxe(page), { timeout: 4000, intervals: [100, 250, 500] })
    .toEqual([]);
};

/** What the bucket would have seen: the browser's PUTs, recorded and answered with 200. */
interface Put {
  url: string;
  headers: Record<string, string>;
  bytes: number;
}
async function fakeBucket(page: Page): Promise<Put[]> {
  const puts: Put[] = [];
  await page.route("https://storage.googleapis.com/**", async (route) => {
    const request = route.request();
    puts.push({
      url: request.url(),
      headers: request.headers(),
      bytes: request.postDataBuffer()?.length ?? 0,
    });
    await route.fulfill({
      status: 200,
      headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" },
    });
  });
  return puts;
}

/** Bytes that start like a ZIP; the stub never reads them. */
const ZIP = {
  name: "export.zip",
  mimeType: "application/zip",
  buffer: Buffer.concat([Buffer.from([0x50, 0x4b, 0x05, 0x06]), Buffer.alloc(18)]),
};

async function openWizard(page: Page, scenario: string, language = "en", theme = "light") {
  await signIn(page, scenario, language, theme);
  await page.goto("/integrations");
  await page.getByRole("button", { name: OPEN }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { level: 2 })).toBeFocused();
  return dialog;
}

/** The primary button of the current step is the last one in the actions row. */
const primary = (dialog: ReturnType<Page["getByRole"]>) => dialog.getByRole("button").last();

async function toUpload(dialog: ReturnType<Page["getByRole"]>) {
  await primary(dialog).click();
  await expect(dialog.locator('input[type="file"]')).toBeAttached();
}
async function toReview(dialog: ReturnType<Page["getByRole"]>) {
  await toUpload(dialog);
  await dialog.locator('input[type="file"]').setInputFiles(ZIP);
  await primary(dialog).click();
  await expect(dialog.getByRole("checkbox").first()).toBeVisible();
}

const stubConfirms = async (page: Page) =>
  (await (
    await page.request.get(`${STUB}/__linkedin?token=${encodeURIComponent(currentToken)}`)
  ).json()) as Array<{
    body: Record<string, Array<Record<string, unknown>>>;
  }>;

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      test.describe(`${language} ${theme} ${size.name}`, () => {
        test.use({ viewport: { width: size.width, height: size.height } });

        test("all four steps: heading focus, axe, clean console", async ({ page }) => {
          const problems = watch(page);
          await fakeBucket(page);
          const dialog = await openWizard(page, "e2e-lk", language, theme);
          await expectCleanAxe(page);

          await primary(dialog).click();
          await expect(dialog.getByRole("heading", { level: 2 })).toBeFocused();
          await expectCleanAxe(page);

          await dialog.locator('input[type="file"]').setInputFiles(ZIP);
          await primary(dialog).click();
          await expect(dialog.getByRole("checkbox").first()).toBeVisible();
          await expect(dialog.getByRole("heading", { level: 2 })).toBeFocused();
          await expectCleanAxe(page);

          // The broken education item, opened for editing.
          await dialog.locator("button[aria-expanded]").nth(1).click();
          await expect(dialog.getByRole("textbox").nth(2)).toBeVisible();
          await expectCleanAxe(page);

          await dialog.getByRole("textbox").nth(2).fill("Placeholder Studies");
          await primary(dialog).click();
          await expect(dialog.locator("h2")).toBeFocused();
          await expect(dialog.getByRole("link")).toHaveCount(1);
          await expectCleanAxe(page);
          expect(problems).toEqual([]);
        });
      });
    }
  }
}

test.describe("behaviour (en, desktop)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("only what is ticked is sent, duplicates cannot be ticked, no secret reaches the bucket or storage", async ({
    page,
  }) => {
    const puts = await fakeBucket(page);
    const dialog = await openWizard(page, "e2e-lk");
    await toReview(dialog);

    const boxes = dialog.getByRole("checkbox");
    // select-all + new job + duplicate job | select-all (empty) + broken degree | select-all + cert | select-all + 2 skills
    await expect(
      dialog.getByRole("checkbox", { name: "Earlier Role · Example Co" }),
    ).toBeDisabled();
    await expect(
      dialog.getByRole("checkbox", { name: "BSc · Placeholder Institute" }),
    ).toBeDisabled();
    await expect(dialog.getByRole("checkbox", { name: /Mocking/ })).toBeDisabled();
    await expect(
      dialog.getByRole("checkbox", { name: "Placeholder Engineer · Example Co" }),
    ).toBeChecked();
    expect(await boxes.count()).toBeGreaterThan(5);

    await dialog.getByRole("checkbox", { name: "Faking" }).uncheck();
    await primary(dialog).click();
    await expect(dialog.getByRole("link")).toBeVisible();

    const [confirm] = await stubConfirms(page);
    expect(confirm?.body.experience).toHaveLength(1);
    expect(confirm?.body.education).toHaveLength(0);
    expect(confirm?.body.certifications).toHaveLength(1);
    expect(confirm?.body.skills).toEqual([]);
    expect(JSON.stringify(confirm?.body)).not.toContain("Earlier Role");

    expect(puts).toHaveLength(1);
    expect(puts[0]?.headers.authorization).toBeUndefined();
    expect(puts[0]?.headers.cookie).toBeUndefined();
    expect(puts[0]?.url).toContain("storage.googleapis.com");
    expect(puts[0]?.bytes).toBe(ZIP.buffer.length);

    const stored = await page.evaluate(() => ({
      local: Object.keys(localStorage).filter((k) => !k.startsWith("gradfolio:")),
      session: Object.keys(sessionStorage),
      url: location.href,
    }));
    expect(stored.local).toEqual([]);
    expect(stored.session).toEqual([]);
    expect(stored.url).not.toContain("linkedin");
  });

  test("the keyboard alone gets through every step", async ({ page }) => {
    await fakeBucket(page);
    await signIn(page, "e2e-lk");
    await page.goto("/integrations");
    const opener = page.getByRole("button", { name: OPEN });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { level: 2 })).toBeFocused();
    await page.keyboard.press("Tab"); // the LinkedIn link
    await page.keyboard.press("Tab"); // Cancel
    await page.keyboard.press("Tab"); // Next
    await expect(primary(dialog)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog.locator('input[type="file"]')).toBeAttached();
    await dialog.locator('input[type="file"]').setInputFiles(ZIP);
    await primary(dialog).focus();
    await page.keyboard.press("Enter");
    await expect(dialog.getByRole("checkbox").first()).toBeVisible();
    const cert = dialog.getByRole("checkbox", { name: "Example Certificate · Example Authority" });
    await cert.focus();
    await page.keyboard.press("Space");
    await expect(cert).not.toBeChecked();
    await primary(dialog).focus();
    await page.keyboard.press("Enter");
    await expect(dialog.getByRole("link")).toBeVisible();
    await primary(dialog).focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("a non-English export says so and lets the file be sent again", async ({ page }) => {
    await fakeBucket(page);
    const dialog = await openWizard(page, "e2e-lklang");
    await toUpload(dialog);
    await dialog.locator('input[type="file"]').setInputFiles(ZIP);
    await primary(dialog).click();
    await expect(dialog.getByRole("alert")).toContainText("not in English");
    await expect(primary(dialog)).toBeEnabled();
  });

  test("a rate-limited upload shows the wait", async ({ page }) => {
    await fakeBucket(page);
    const dialog = await openWizard(page, "e2e-lkrl");
    await toUpload(dialog);
    await dialog.locator('input[type="file"]').setInputFiles(ZIP);
    await primary(dialog).click();
    await expect(dialog.getByRole("alert")).toContainText("30 seconds");
  });

  test("a full section keeps the proposal and says nothing was added", async ({ page }) => {
    await fakeBucket(page);
    const dialog = await openWizard(page, "e2e-lkfull");
    await toReview(dialog);
    await primary(dialog).click();
    await expect(dialog.getByRole("alert").filter({ hasText: "Nothing was added" })).toBeVisible();
    await expect(dialog.getByRole("checkbox").first()).toBeVisible();
  });

  test("a proposal with nothing new says so and cannot add", async ({ page }) => {
    await fakeBucket(page);
    const dialog = await openWizard(page, "e2e-lkempty");
    await toReview(dialog);
    await expect(
      dialog.getByText("Everything in this file is already on your profile."),
    ).toBeVisible();
    await expect(primary(dialog)).toBeDisabled();
  });

  test("the card opens the wizard on the onboarding step too", async ({ page }) => {
    await signIn(page, "e2e-lk");
    await page.goto("/integrations/connections");
    await page.getByRole("button", { name: "Step 2 of 2" }).click();
    await page.getByRole("button", { name: OPEN }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
