import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  {
    languageOptions: { globals: globals.browser }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      quotes: ["error", "double"],
      "import/no-unresolved": 0,
      indent: ["off"],
      "object-curly-spacing": [2, "always"],
      "new-cap": 0,
      "operator-linebreak": 0,
      "@typescript-eslint/no-var-requires": 0,
      "@typescript-eslint/no-explicit-any": ["off"],
      "max-len": ["warn", 120],
      "require-jsdoc": 0,

      "prefer-const": [
        "warn",
        {
          destructuring: "all",
          ignoreReadBeforeAssign: false
        }
      ],

      "space-before-function-paren": 0,
      "one-var": [0],
      "quote-props": 0,
      "valid-jsdoc": 0,
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-non-null-assertion": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ]
    }
  }
];
