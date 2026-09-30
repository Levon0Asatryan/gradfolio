import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import next from "@next/eslint-plugin-next";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import prettier from "eslint-config-prettier/flat";

export default [
  // Ignore build output + env files
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.env*",
      "next-env.d.ts",
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript recommended
  ...tseslint.configs.recommended,

  // App code
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      "@next/next": next,
      react,
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...next.configs["core-web-vitals"].rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React 17+ / Next.js: no need for `import React`
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      // This rule is noisy in real apps; disable or change to "warn"
      "react-hooks/set-state-in-effect": "off",

      "@typescript-eslint/no-explicit-any": "off",

      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],

      "prefer-const": "error",
      "no-console": ["error", { allow: ["error", "warn"] }],

      // allow `catch {}` patterns
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // Runs in Claude Code's workflow runtime, which injects these.
  {
    files: [".claude/workflows/**/*.js"],
    languageOptions: {
      globals: { agent: "readonly", pipeline: "readonly", phase: "readonly", log: "readonly" },
    },
  },

  // Prettier turns off stylistic conflicts
  prettier,
];
