import { expect, test } from "@playwright/test";
import { consoleProblems } from "./fixtures/console-problems";

test("hosting-only script failures are excluded while application HTTP failures are reported", async ({
  page,
}) => {
  await page.route("**/qa-console-probe", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Console probe</h1>" }),
  );
  await page.route("**/_vercel/qa.js", (route) => route.fulfill({ status: 404, body: "missing" }));
  await page.route("**/qa-api", (route) => route.fulfill({ status: 500, body: "failed" }));
  await page.goto("/qa-console-probe");
  const found = consoleProblems(page);
  await page.evaluate(async () => {
    await fetch("/_vercel/qa.js");
    await fetch("/qa-api");
  });
  await expect.poll(() => found).toEqual([`500 ${new URL("/qa-api", page.url()).href}`]);
});

test("uncaught browser exceptions are still reported", async ({ page }) => {
  await page.route("**/qa-console-probe", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Console probe</h1>" }),
  );
  await page.goto("/qa-console-probe");
  const found = consoleProblems(page);
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("QA uncaught exception");
    }, 0);
  });
  await expect.poll(() => found).toContain("pageerror: QA uncaught exception");
});

test("cancelled RSC prefetches are excluded while genuine network failures are reported", async ({
  page,
}) => {
  await page.route("**/qa-console-probe", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Console probe</h1>" }),
  );
  await page.route("**/qa-cancel?_rsc=probe", (route) => route.abort("aborted"));
  await page.route("**/qa-failed", (route) => route.abort("failed"));
  await page.goto("/qa-console-probe");
  const found = consoleProblems(page);
  await page.evaluate(async () => {
    await fetch("/qa-cancel?_rsc=probe").catch(() => {});
    await fetch("/qa-failed").catch(() => {});
  });
  await expect
    .poll(() => found)
    .toEqual([`net::ERR_FAILED ${new URL("/qa-failed", page.url()).href}`]);
});
