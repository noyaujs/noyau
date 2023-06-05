/* eslint-env node */
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "import"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    project: [
      "./tsconfig.eslint.json",
      "./packages/**/tsconfig.json",
      "./playground/tsconfig.json",
    ],
  },
  root: true,
  rules: {
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "import/consistent-type-specifier-style": ["error", "prefer-inline"],
    "import/no-duplicates": [
      "error",
      { "prefer-inline": true, considerQueryString: true },
    ],
    "import/order": "error",

    // todo: enable this rule
    "@typescript-eslint/no-unsafe-call": "off",
  },
};
