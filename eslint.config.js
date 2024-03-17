import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["_*", "docs/**"],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  js.configs.recommended,
  prettier,
];
