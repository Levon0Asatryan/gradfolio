import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { en } from "../src/data/locales/en";
import { ru } from "../src/data/locales/ru";
import { am } from "../src/data/locales/am";

for (const [language, t] of [
  ["en", en],
  ["ru", ru],
  ["am", am],
] as const) {
  for (const width of [390, 1440]) {
    test(`guest prompt and menu: ${language}, ${width}px`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.context().addCookies([{ name: "language", value: language, url: baseURL! }]);
      const logins: string[] = [];
      page.on("request", (r) => {
        if (new URL(r.url()).pathname === "/auth/login") logins.push(r.url());
      });
      await page.goto("/account");
      await expect(page).toHaveURL(/\/sign-in\?returnTo=%2Faccount$/);
      await expect(
        page.getByRole("heading", { level: 1, name: t.common.signInRequired }),
      ).toBeVisible();
      const nav = page.getByRole("navigation", { name: t.common.mainMenu });
      await expect(
        nav.getByRole("link", { name: t.common.publicProjects, exact: true }),
      ).toBeVisible();
      await expect(nav.getByRole("link", { name: t.common.people, exact: true })).toBeVisible();
      await expect(nav.getByRole("link", { name: t.common.myProjects, exact: true })).toHaveCount(
        0,
      );
      await expect(nav.getByRole("link", { name: t.common.login, exact: true })).toHaveAttribute(
        "href",
        "/auth/login",
      );
      await expect(
        page.locator("main").getByRole("link", { name: t.common.login, exact: true }),
      ).toHaveAttribute("href", "/auth/login?returnTo=%2Faccount");
      expect(
        (await new AxeBuilder({ page }).analyze()).violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        ),
      ).toEqual([]);
      expect(logins).toEqual([]);
      await page.getByRole("link", { name: t.common.continueBrowsing }).click();
      await expect(page).toHaveURL(/\/search$/);
      expect(logins).toEqual([]);
    });
  }
}
