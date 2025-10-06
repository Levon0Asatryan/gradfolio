import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Target files + parser/globals
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: true,
      },
      globals: globals.browser,
    },
  },

  // Next.js recommended configs (via compat) + TS recommended
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...tseslint.configs.recommended,

  // Only the plugins/rules we actually want to enforce
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // Unused imports & vars (remove on --fix, allow _-prefixed)
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],

      // A few sensible strict rules
      "prefer-const": "error",
      "no-console": ["error", { allow: ["error", "warn"] }],
    },
  },

  // Turn off stylistic rules that conflict with Prettier
  eslintConfigPrettier,

  // Ignores
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];
