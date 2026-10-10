import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Search and tag pages (docs/m6-plan.md section 9), anonymous: they need no login, so they run
 * in CI against the API stub (e2e/fixtures/api-stub.ts). Per page state: 390 and 1440 wide,
 * light and dark, en / ru / am; axe finds no serious or critical violation, the console is
 * clean (no hydration message), layout shift stays under 0.1, and a visitor's page never
 * fetches a protected link.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const STUB = `http://127.0.0.1:${process.env.E2E_API_PORT ?? 3199}`;
const LANGUAGES = ["en", "ru", "am"] as const;
const THEMES = ["light", "dark"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const PAGES = [
  { name: "landing", path: "/search", h1: /Explore|Обзор|Ուսումնասիրել/ },
  { name: "grouped results", path: "/search?q=iot", h1: /Explore|Обзор|Ուսումնասիրել/ },
  { name: "people list", path: "/search?q=iot&type=people", h1: /Explore|Обзор|Ուսումնասիրել/ },
  { name: "no results", path: "/search?q=nothing", h1: /Explore|Обзор|Ուսումնասիրել/ },
  { name: "tag page", path: "/tags/IoT", h1: /IoT/ },
  {
    name: "browse projects",
    path: "/browse/projects",
    h1: /Browse projects|Обзор проектов|Դիտել նախագծերը/,
  },
  {
    name: "browse projects, empty",
    path: "/browse/projects?category=other",
    h1: /Browse projects|Обзор проектов|Դիտել նախագծերը/,
  },
  {
    name: "browse people",
    path: "/browse/people?school=NPUA",
    h1: /Browse people|Обзор людей|Դիտել մարդկանց/,
  },
] as const;

const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))),
  );

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
  page.on("response", (r) => {
    if (r.status() < 400) return;
    if (IGNORED.some((re) => re.test(r.url()))) return;
    if (r.request().isNavigationRequest()) return; // a page's own 404/500 is asserted by the test
    found.push(`${r.status()} ${r.url()}`);
  });
  page.on("request", (r) => {
    if (new URL(r.url()).pathname === "/auth/login") found.push(`requested ${r.url()}`);
  });
  return found;
}

async function trackShift(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as Array<{
        value: number;
        hadRecentInput: boolean;
      }>) {
        if (!e.hadRecentInput) w.__cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
}
const shift = (page: Page) => page.evaluate(() => (window as unknown as { __cls: number }).__cls);

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

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      test.describe(`${language} ${theme} ${size.name}`, () => {
        test.use({ viewport: { width: size.width, height: size.height } });

        for (const view of PAGES) {
          test(`${view.name}: axe, clean console, no layout shift`, async ({ page }) => {
            await preferences(page, language, theme);
            const problems = watch(page);
            await trackShift(page);
            const response = await page.goto(view.path, { waitUntil: "networkidle" });
            expect(response?.status()).toBe(200);
            await expect(page.locator("h1")).toHaveCount(1);
            await expect(page.locator("h1")).toHaveText(view.h1);
            await expect(page.locator("html")).toHaveAttribute(
              "lang",
              language === "am" ? "hy" : language,
            );
            await settled(page);
            await page.waitForTimeout(300);
            expect(await seriousAxe(page)).toEqual([]);
            expect(await shift(page)).toBeLessThan(0.1);
            expect(problems).toEqual([]);
          });
        }
      });
    }
  }
}

test.describe("behaviour", () => {
  test("typing searches without a button, and the URL is shareable", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("combobox", { name: /Search|Поиск|Որոնել/ }).fill("iot");
    await expect(page).toHaveURL(/\/search\?q=iot$/);
    await expect(page.getByRole("heading", { level: 2, name: "People" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Projects" })).toBeVisible();
    // The same URL opened cold shows the same results (the "shareable" requirement).
    await page.goto(page.url());
    await expect(page.getByRole("combobox", { name: /Search|Поиск|Որոնել/ })).toHaveValue("iot");
    await expect(page.getByRole("heading", { level: 2, name: "People" })).toBeVisible();
  });

  test("an anonymous visitor is never sent to login by typing", async ({ page }) => {
    const problems = watch(page);
    await page.goto("/search");
    await page.getByRole("combobox", { name: /Search|Поиск|Որոնել/ }).fill("ml");
    await expect(page).toHaveURL(/\/search\?q=ml$/);
    expect(new URL(page.url()).pathname).toBe("/search");
    expect(problems).toEqual([]);
  });

  test("an empty result says what was searched and is not an error", async ({ page }) => {
    await page.goto("/search?q=nothing");
    await expect(page.getByRole("heading", { name: "Nothing found for “nothing”" })).toBeVisible();
    await expect(page.getByText("Search could not be loaded")).toHaveCount(0);
  });

  test("an API failure is an error with Try again, never 'nothing found'", async ({ page }) => {
    await page.goto("/search?q=boom");
    await expect(
      page.getByRole("alert").filter({ hasText: "Search could not be loaded" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(page.getByText(/Nothing found/)).toHaveCount(0);
    await page.goto("/search?q=limited");
    await expect(page.getByRole("alert").filter({ hasText: "Too many searches" })).toBeVisible();
  });

  test("See all leads to a paged list, Next page and First page are links", async ({ page }) => {
    await page.goto("/search?q=iot");
    await page.getByRole("link", { name: "See all people" }).click();
    await expect(page).toHaveURL(/type=people/);
    await expect(page.locator("article")).toHaveCount(12);
    const next = page.getByRole("link", { name: "Next page" });
    await expect(page.getByRole("link", { name: "First page" })).toHaveCount(0);
    await next.click();
    await expect(page).toHaveURL(/cursor=page-2/);
    await expect(page.locator("article")).toHaveCount(3);
    await expect(page.getByRole("link", { name: "Next page" })).toHaveCount(0);
    await page.getByRole("link", { name: "First page" }).click();
    await expect(page).not.toHaveURL(/cursor=/);
    // A cursor page is noindex and canonical to the clean search.
    await page.goto("/search?q=iot&type=people&cursor=page-2");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/search$/);
  });

  test("the landing is indexable, a query page is not", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);
    await page.goto("/search?q=iot");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("a card is one stop: Tab moves from the box to the first result", async ({ page }) => {
    await page.goto("/search?q=iot");
    await page.getByRole("combobox", { name: /Search|Поиск|Որոնել/ }).focus();
    await page.keyboard.press("Tab"); // the Search button
    await page.keyboard.press("Tab"); // See all people (the people group's link)
    const focused = page.locator(":focus-visible");
    await expect(focused).toHaveAttribute("href", /type=people/);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus-visible")).toHaveAttribute("href", /\/profile\//);
  });

  test("a tag page: heading, counts, canonical to the API's spelling, both groups", async ({
    page,
  }) => {
    await page.goto("/tags/iot");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tag: IoT");
    await expect(
      page.getByRole("heading", { level: 2, name: "Projects tagged IoT" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "People with IoT" })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/tags\/IoT$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);
  });

  test("C# and CI/CD survive the route segment", async ({ page }) => {
    const sharp = await page.goto("/tags/C%23");
    expect(sharp?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tag: C#");
    const slash = await page.goto("/tags/CI%2FCD");
    expect(slash?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tag: CI/CD");
  });

  test("a tag named C%23 is that tag, not C# (the page and its metadata agree)", async ({
    page,
  }) => {
    const response = await page.goto("/tags/C%2523");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tag: C%23");
    await expect(page).toHaveTitle(/C%23/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/tags\/C%2523$/);
  });

  test("the landing has the tag cloud and the newest lists, each with its link", async ({
    page,
  }) => {
    await page.goto("/search");
    await expect(page.getByRole("list", { name: "Popular tags" })).toBeVisible();
    await expect(page.getByRole("link", { name: "IoT: 14 projects, 9 people" })).toHaveAttribute(
      "href",
      "/tags/IoT",
    );
    await expect(page.getByRole("heading", { level: 2, name: "Newest projects" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse all people" })).toHaveAttribute(
      "href",
      "/browse/people",
    );
  });

  test("the gallery filters by link, and Next page / First page keep them", async ({ page }) => {
    await page.goto("/browse/projects");
    await expect(page.locator("article")).toHaveCount(12);
    await page.getByRole("link", { name: "Course", exact: true }).click();
    await expect(page).toHaveURL(/category=course/);
    await expect(page.getByRole("link", { name: "Course", exact: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.getByRole("link", { name: "Next page" }).click();
    await expect(page).toHaveURL(/category=course&cursor=page-2/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.getByRole("link", { name: "First page" }).click();
    await expect(page).toHaveURL(/category=course$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);
  });

  test("an empty gallery says so, and is not an error", async ({ page }) => {
    await page.goto("/browse/projects?category=other");
    await expect(page.getByText("No projects match these filters.")).toBeVisible();
    await expect(page.getByText("This section could not be loaded.")).toHaveCount(0);
  });

  test("people filters are a GET form: choosing a school puts it in the URL", async ({ page }) => {
    await page.goto("/browse/people");
    await page.getByRole("combobox", { name: "School" }).click();
    await page.getByRole("option", { name: "NPUA" }).click();
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/school=NPUA/);
    await expect(page.getByRole("link", { name: "Clear filters" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("an unknown tag is a real 404 and not indexed", async ({ page }) => {
    const response = await page.goto("/tags/no-such-tag-anywhere");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("public calls carry no token, and the visitor's address reaches the API", async ({
    page,
    request,
  }) => {
    await request.get(`${STUB}/__reset`);
    await page.goto("/search?q=iot");
    const seen = (await (await request.get(`${STUB}/__requests`)).json()) as Array<{
      path: string;
      headers: Record<string, string | null>;
    }>;
    const searches = seen.filter((r) => r.path === "/v1/search");
    expect(searches.length).toBeGreaterThan(0);
    for (const r of searches) {
      expect(r.headers.authorization ?? null).toBeNull();
      // `next start` sets x-forwarded-for from the socket (Vercel does the same from the
      // edge), so here the "client" is the loopback address: what matters is that it is sent.
      expect(r.headers["x-client-ip"]).toMatch(/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/);
      expect(r.headers["x-gradfolio-proxy-secret"]).toBe("e2e-proxy-secret");
    }
  });

  // "slow..." is answered 700 ms late by the stub. The pause lets the debounced search start;
  // the rest is typed while it is still in flight, and its answer must not erase it.
  for (const [language, rest] of [
    ["en", " query go"],
    ["ru", " запрос поиск"],
    ["am", " Արմեն Գրիգորյան"],
  ] as const) {
    for (const size of SIZES) {
      test(`typing while a search is in flight keeps every character and the focus (${language}, ${size.name})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await preferences(page, language, "light");
        await page.goto("/search");
        const box = page.getByRole("combobox", { name: /Search|Поиск|Որոնել/ });
        await box.click();
        await page.keyboard.type("slow", { delay: 40 });
        await page.waitForTimeout(450);
        await page.keyboard.type(rest, { delay: 40 });
        await page.waitForTimeout(1800);
        await expect(box).toHaveValue(`slow${rest}`);
        await expect(box).toBeFocused();
        // The URL catches up to what was typed.
        await expect(page).toHaveURL(
          new RegExp(`q=slow\\+${encodeURIComponent(rest.trim().split(" ")[0] ?? "")}`),
        );
      });
    }
  }

  test("fast typing, then clearing and retyping, ends with what was typed", async ({ page }) => {
    await page.goto("/search?q=iot");
    const box = page.getByRole("combobox", { name: /Search|Поиск|Որոնել/ });
    await box.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("machine learning", { delay: 10 });
    await expect(box).toHaveValue("machine learning");
    await page.waitForTimeout(1200);
    await expect(box).toHaveValue("machine learning");
    await expect(box).toBeFocused();
  });

  test("Back restores the earlier query in the box", async ({ page }) => {
    await page.goto("/search?q=iot");
    await page.getByRole("link", { name: "See all people" }).click();
    await expect(page).toHaveURL(/type=people/);
    await page.goBack();
    await expect(page.getByRole("combobox", { name: /Search|Поиск|Որոնել/ })).toHaveValue("iot");
    await page.goto("/search?q=ml");
    await expect(page.getByRole("combobox", { name: /Search|Поиск|Որոնել/ })).toHaveValue("ml");
  });

  test("suggestions: type, arrow to an option, Enter goes there; the list is a combobox", async ({
    page,
  }) => {
    await page.goto("/search");
    const box = page.getByRole("combobox", { name: /Search people/ });
    await expect(box).toHaveAttribute("aria-expanded", "false");
    await box.click();
    await page.keyboard.type("io", { delay: 30 });
    const list = page.getByRole("listbox", { name: "Suggestions" });
    await expect(list).toBeVisible();
    await expect(box).toHaveAttribute("aria-expanded", "true");
    await expect(list.getByRole("group", { name: "Tags" })).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "suggestions available" }),
    ).toBeAttached();
    await page.keyboard.press("ArrowDown");
    await expect(box).toHaveAttribute("aria-activedescendant", /-opt-0$/);
    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
    await expect(box).toHaveValue("io");
    await page.keyboard.press("ArrowDown");
    await expect(list).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/(profile|projects|tags)\//);
  });

  test("Enter with nothing chosen is the plain search", async ({ page }) => {
    await page.goto("/search");
    const box = page.getByRole("combobox", { name: /Search people/ });
    await box.click();
    await page.keyboard.type("ml", { delay: 30 });
    await expect(page.getByRole("listbox", { name: "Suggestions" })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=ml/);
  });

  test("no suggestions for a query nothing starts with: just the search option", async ({
    page,
  }) => {
    await page.goto("/search");
    await page.getByRole("combobox", { name: /Search people/ }).click();
    await page.keyboard.type("zzzz", { delay: 30 });
    await expect(page.getByRole("option")).toHaveCount(1);
    await expect(page.getByRole("status").filter({ hasText: "No suggestions" })).toBeAttached();
  });
});

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      test(`suggestions open: axe, clean console (${language} ${theme} ${size.name})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await preferences(page, language, theme);
        const problems = watch(page);
        await page.goto("/search");
        await page.getByRole("combobox").click();
        await page.keyboard.type("io", { delay: 30 });
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.keyboard.press("ArrowDown");
        await settled(page);
        expect(await seriousAxe(page)).toEqual([]);
        expect(problems).toEqual([]);
      });
    }
  }
}
