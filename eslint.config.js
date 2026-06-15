import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/", "docs/", "node_modules/", "playwright-report/", "test-results/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // Allow intentionally-unused names prefixed with `_` (e.g. stub params).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Tests, e2e specs, build scripts and config files run under Node.
    files: ["**/*.test.ts", "e2e/**/*.ts", "scripts/**/*.mjs", "*.config.{js,ts}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
