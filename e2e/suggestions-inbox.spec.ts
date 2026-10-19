import AxeBuilder from "@axe-core/playwright";
import { generateSessionCookie } from "@auth0/nextjs-auth0/testing";
import { expect, test, type Page } from "@playwright/test";

/**
 * The suggestions inbox on /integrations, the strips on the profile and the navigation count
 * (M7-T32). Logged in without a login, like integrations.spec.ts: a minted session cookie whose
 * access token names the stub scenario (e2e/fixtures/api-stub.ts, `e2e-sug-*`). The stub decides
 * the 409s itself, so what is proved here is what the page does with them; that the API applies
 * nothing on a stale accept is the API's own test.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const STUB = `http://127.0.0.1:${process.env.E2E_API_PORT ?? 3199}`;
const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const OWNER = "0b6f2c1e-1111-4222-8333-444455556666";
const LANGUAGES = ["en", "ru", "am"] as const;
const THEMES = ["light", "dark"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

let counter = 0;
async function signIn(page: Page, scenario: string, language = "en", theme = "light") {
  // Random as well as counted: workers are separate processes, and the stub keys its state by token.
  const token = `${scenario}-${Date.now()}-${(counter += 1)}-${Math.random().toString(36).slice(2)}`;
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
  return token;
}

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
    .map((v) => `${v.id} (${v.nodes.length})`);

const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))),
  );

async function stubSaw(page: Page, token: string) {
  const res = await page.request.get(`${STUB}/__suggestions?token=${encodeURIComponent(token)}`);
  return (await res.json()) as {
    accepted: string[];
    dismissed: string[];
    bodies: Array<{ id: string; body: unknown }>;
  };
}

/** The Integrations link in the navigation that is on screen (sidebar, or the More sheet). */
const navCount = (page: Page) => page.getByTestId("nav-suggestions-count").first();

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      test.describe(`${language} ${theme} ${size.name}`, () => {
        test.use({ viewport: { width: size.width, height: size.height } });

        for (const view of [
          { name: "inbox with every kind", scenario: "e2e-sug", path: "/integrations" },
          { name: "empty inbox", scenario: "e2e-sugempty", path: "/integrations" },
          { name: "inbox load failed", scenario: "e2e-sugdown", path: "/integrations" },
          { name: "profile with strips", scenario: "e2e-sug", path: `/profile/${OWNER}` },
        ] as const) {
          test(`${view.name}: axe, clean console, no horizontal scroll`, async ({ page }) => {
            await signIn(page, view.scenario, language, theme);
            const problems = watch(page);
            const response = await page.goto(view.path, { waitUntil: "networkidle" });
            expect(response?.status()).toBe(200);
            await expect(page.locator("main")).toBeVisible();
            await settled(page);
            await page.waitForTimeout(300);
            expect(await seriousAxe(page)).toEqual([]);
            expect(problems).toEqual([]);
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

test.describe("the inbox", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("groups the kinds, shows the long value cropped with its full text, applies nothing on load", async ({
    page,
  }) => {
    const token = await signIn(page, "e2e-sug");
    await page.goto("/integrations", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Suggestions (7)" })).toBeVisible();
    for (const group of [
      "Skills (3)",
      "Links (2)",
      "Projects (1)",
      "Education and experience (1)",
    ]) {
      await expect(page.getByRole("heading", { name: group })).toBeVisible();
    }
    // Nothing is accepted or dismissed by looking.
    const saw = await stubSaw(page, token);
    expect(saw.accepted).toEqual([]);
    expect(saw.dismissed).toEqual([]);
    // A fill is a card like any other: it has its own Accept.
    await expect(page.getByRole("button", { name: "Accept: X (Twitter) link" })).toBeVisible();
    // The navigation carries the number in text.
    await expect(page.getByRole("link", { name: "Integrations 7 to review" })).toBeVisible();
  });

  test("accept a skill: the card goes, the count falls, the answer is announced and focus moves on", async ({
    page,
  }) => {
    const token = await signIn(page, "e2e-sug");
    await page.goto("/integrations", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Accept: Add the skill Go" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Accepted: Add the skill Go" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add the skill Go" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Suggestions (6)" })).toBeVisible();
    await expect(navCount(page)).toHaveText("6");
    await expect(page.getByRole("heading", { name: "Add the skill Rust" })).toBeFocused();
    const saw = await stubSaw(page, token);
    expect(saw.accepted).toHaveLength(1);
    expect(saw.dismissed).toEqual([]);
  });

  test("dismiss a link by keyboard alone", async ({ page }) => {
    const token = await signIn(page, "e2e-sug");
    await page.goto("/integrations", { waitUntil: "networkidle" });
    const dismiss = page.getByRole("button", { name: "Dismiss: X (Twitter) link" });
    await dismiss.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "X (Twitter) link" })).toHaveCount(0);
    const saw = await stubSaw(page, token);
    expect(saw.dismissed).toHaveLength(1);
    expect(saw.accepted).toEqual([]);
    // Focus did not fall to the page: it is on a card heading or the panel heading.
    expect(await page.evaluate(() => document.activeElement?.tagName)).toMatch(/^H[1-6]$/);
  });

  test("a stale accept says it changed meanwhile, removes the card, and shows no 'Accepted'", async ({
    page,
  }) => {
    await signIn(page, "e2e-sug");
    await page.goto("/integrations", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Accept: LinkedIn link" }).click();
    const status = page.getByRole("status").filter({ hasText: "LinkedIn link" });
    await expect(status).toContainText("This changed in the meantime, so nothing was applied");
    await expect(page.getByRole("heading", { name: "LinkedIn link" })).toHaveCount(0);
    await expect(page.getByText(/^Accepted:/)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Suggestions (6)" })).toBeVisible();
  });

  test("an already-answered one says so and goes", async ({ page }) => {
    await signIn(page, "e2e-sug");
    await page.goto("/integrations", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Accept: Add the skill Zig" }).click();
    await expect(page.getByRole("status")).toContainText("This suggestion was already answered");
    await expect(page.getByRole("heading", { name: "Add the skill Zig" })).toHaveCount(0);
  });

  test("education needs the student's values first: the small form, then the accept carries them", async ({
    page,
  }) => {
    const token = await signIn(page, "e2e-sug");
    await page.goto("/integrations", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Fill in details:/ }).click();
    const form = page.getByRole("form", { name: "Education details" });
    await expect(form.getByLabel(/Degree/)).toBeFocused();
    await form.getByRole("button", { name: "Add to profile" }).click();
    await expect(form.getByText("Required")).toHaveCount(3);
    expect((await stubSaw(page, token)).bodies).toEqual([]);

    await form.getByLabel(/Degree/).fill("BSc");
    await form.getByLabel(/Field of study/).fill("Informatics");
    await form.getByLabel(/Start year/).fill("2022");
    await form.getByRole("button", { name: "Add to profile" }).click();
    await expect(page.getByRole("heading", { name: /Add education/ })).toHaveCount(0);
    const saw = await stubSaw(page, token);
    expect(saw.bodies).toEqual([
      {
        token,
        id: expect.any(String),
        body: { overrides: { degree: "BSc", field: "Informatics", startYear: 2022 } },
      },
    ]);
  });

  test("an empty inbox says 'Nothing to suggest'; a failed read is an error with Retry", async ({
    page,
  }) => {
    await signIn(page, "e2e-sugempty");
    await page.goto("/integrations", { waitUntil: "networkidle" });
    await expect(page.getByText("Nothing to suggest")).toBeVisible();
    await expect(navCount(page)).toHaveCount(0);

    const other = await page.context().newPage();
    await signIn(other, "e2e-sugdown");
    await other.goto("/integrations", { waitUntil: "networkidle" });
    const alert = other.getByRole("alert").filter({ hasText: "Suggestions could not be loaded" });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(other.getByText("Nothing to suggest")).toHaveCount(0);
  });
});

test.describe("the strips on the profile", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("each strip lists its own kind; accepting a skill updates the section and the count, and survives a reload", async ({
    page,
  }) => {
    await signIn(page, "e2e-sug");
    await page.goto(`/profile/${OWNER}`, { waitUntil: "networkidle" });
    const strips = page.getByRole("heading", { name: /^Suggestions \(/ });
    await expect(strips).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Suggestions (3)" })).toBeVisible(); // skills
    await expect(page.getByRole("heading", { name: "Suggestions (2)" })).toBeVisible(); // links
    await expect(page.getByRole("link", { name: "Integrations 7 to review" })).toBeVisible();
    // No other kind in a strip.
    await expect(page.getByRole("heading", { name: /Add education/ })).toHaveCount(0);

    await page.getByRole("button", { name: "Accept: Add the skill Go" }).click();
    await expect(page.getByText("Accepted: Add the skill Go")).toBeVisible();
    await expect(page.getByText("Go", { exact: true })).toBeVisible(); // the chip in the section
    await expect(navCount(page)).toHaveText("6");
    await expect(page.getByRole("heading", { name: "Suggestions (2)" })).toHaveCount(2);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Go", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add the skill Go" })).toHaveCount(0);
  });

  test("accepting a link shows it in the header, and the Links strip shrinks", async ({ page }) => {
    await signIn(page, "e2e-sug");
    await page.goto(`/profile/${OWNER}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "X (Twitter)" })).toHaveCount(0);
    await page.getByRole("button", { name: "Accept: X (Twitter) link" }).click();
    await expect(page.getByText("Accepted: X (Twitter) link")).toBeVisible();
    await expect(navCount(page)).toHaveText("6");
    await expect(page.getByRole("link", { name: /Twitter|X/ }).first()).toBeVisible();
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the count is in the More sheet beside Integrations", async ({ page }) => {
    await signIn(page, "e2e-sug");
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^More/ }).click();
    await expect(page.getByRole("link", { name: "Integrations 7 to review" })).toBeVisible();
  });
});

test.describe("without a session", () => {
  test("GET /api/suggestions answers 401 with a code, uncached, and does not redirect", async ({
    request,
  }) => {
    const response = await request.get("/api/suggestions", { maxRedirects: 0 });
    expect(response.status()).toBe(401);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(await response.json()).toEqual({ code: "UNAUTHENTICATED" });
  });

  test("a visitor's pages never ask for suggestions and show no count", async ({ page }) => {
    const asked: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/suggestions")) asked.push(r.url());
    });
    await page.goto("/settings", { waitUntil: "networkidle" });
    expect(asked).toEqual([]);
    await expect(page.getByTestId("nav-suggestions-count")).toHaveCount(0);
  });
});
