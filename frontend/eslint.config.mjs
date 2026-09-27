import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "@next/eslint-plugin-next";
import hooks from "eslint-plugin-react-hooks";
export default defineConfig([
  globalIgnores([".next/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
  { files: ["**/*.{ts,tsx}"], extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { "@next/next": next, "react-hooks": hooks },
    rules: { ...next.configs.recommended.rules, ...next.configs["core-web-vitals"].rules, ...hooks.configs.recommended.rules },
    languageOptions: { globals: { React: "readonly", process: "readonly", __dirname: "readonly", window: "readonly", document: "readonly", fetch: "readonly", RequestInit: "readonly", Response: "readonly" } },
  },
]);
