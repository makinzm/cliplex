import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e", 
  // ↑ これで tests/e2e配下 だけを探すようになる
  // testMatch: ["**/*.spec.ts"], // 必要に応じて
  // ...
});

