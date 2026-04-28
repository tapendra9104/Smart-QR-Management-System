export default [
  {
    ignores: [
      ".next/**",
      "backend/**",
      "gateway/**",
      "node_modules/**",
      "k8s/**",
      "public/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        alert: "readonly",
        atob: "readonly",
        Blob: "readonly",
        ClipboardItem: "readonly",
        document: "readonly",
        fetch: "readonly",
        FileReader: "readonly",
        Headers: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        process: "readonly",
        React: "readonly",
        Response: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
        window: "readonly",
      },
    },
    rules: {},
  },
];
