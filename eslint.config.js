import nextConfig from "eslint-config-next/core-web-vitals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      ".next/**",
      "out/**",
      "legacy/**",
      "**/*.config.js",
    ],
  },
  // Root site: Next.js app.
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [nextConfig],
  },
  // Plain TS libraries: alma-core, cli.
  {
    files: ["packages/*/src/**/*.ts", "packages/*/test/**/*.ts"],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
  // identity-studio: Vite + React app.
  {
    files: ["apps/identity-studio/src/**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommended],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  }
);
