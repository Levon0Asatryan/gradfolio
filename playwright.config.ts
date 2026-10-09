import { defineConfig, devices } from "@playwright/test";

/**
 * Browser smoke tests that need no login (docs/m4-plan.md §8). They run against the
 * production build, `next start`, with throwaway Auth0 values: every page renders without
 * real ones (CLAUDE.md), and nothing here ever signs in or holds a credential.
 *
 *   npm run build && npm run e2e
 *
 * Browsers: Playwright reads PLAYWRIGHT_BROWSERS_PATH. On the university machine keep it
 * in the sandbox (`/Users/levon/Dev/university/.sandbox/ms-playwright`) so nothing lands
 * in ~/Library/Caches, then `npx playwright install chromium`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Not started when PLAYWRIGHT_BASE_URL points at a running site.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        url: `${baseURL}/settings`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        env: {
          AUTH0_DOMAIN: "e2e.example.auth0.com",
          AUTH0_CLIENT_ID: "e2e-client",
          AUTH0_CLIENT_SECRET: "e2e-secret",
          AUTH0_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          APP_BASE_URL: baseURL,
          NEXT_TELEMETRY_DISABLED: "1",
        },
      },
});
