import { defineConfig } from "vitest/config";

// Dates render in the process's time zone and ICU locale. Pin both before the
// workers start (they inherit this environment), so a test's expected string
// is the same on a laptop in Yerevan and on the CI runner.
process.env.TZ = "UTC";
process.env.LANG = "en_US.UTF-8";
process.env.LC_ALL = "en_US.UTF-8";

export default defineConfig({
  // `@/` comes from tsconfig.json's paths; no second copy of the alias here.
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // Components need a DOM. Tests that need none (scripts/) opt out per file
    // with `// @vitest-environment node`.
    environment: "jsdom",
    setupFiles: ["src/testing/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        // Test-only helpers, never shipped.
        "src/testing/**",
        // Mock data: fixtures until the API serves real data, not logic.
        "src/data/*.mock.ts",
        // Types only.
        "src/data/locales/types.ts",
        "src/utils/types/**",
        "src/components/**/types.ts",
      ],
      // A ratchet, not an aspiration: at or just below what the suite
      // achieves, so coverage cannot silently fall. Raise it as tests land.
      //
      // Pinned to the literal achieved percentage, branches failed CI at 1.69%
      // against a 1.7% floor while this machine measured exactly 1.7%: V8's
      // branch count for the same source can differ by a couple of branches
      // between Node versions (local 24.20.0 vs. the CI runner's). A margin
      // below the measured value absorbs that, instead of the floor and the
      // achieved number colliding on every patch release.
      thresholds: {
        lines: 1.5,
        functions: 1,
        branches: 1.5,
        statements: 1.5,
      },
    },
  },
});
