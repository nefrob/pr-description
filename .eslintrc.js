module.exports = {
    env: {
        es6: true,
        jest: true,
        node: true,
    },
    extends: ["eslint:recommended", "plugin:prettier/recommended"],
    ignorePatterns: ["dist", "node_modules"],
    parser: "@babel/eslint-parser",
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
        requireConfigFile: false,
    },
    plugins: ["prettier", "simple-import-sort", "unused-imports"],
    root: true,
    rules: {
        "linebreak-style": ["error", "unix"],
        "no-console": "error",
        "no-unused-vars": "off",
        "prettier/prettier": "error",
        "simple-import-sort/exports": "error",
        "simple-import-sort/imports": "error",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": "error",
    },
};
