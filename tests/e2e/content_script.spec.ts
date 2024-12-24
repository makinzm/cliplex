// tests/e2e/content_script.spec.ts
import { test, expect, chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as util from "util";

// 非同期でディレクトリを削除するためのユーティリティ
const rmdir = util.promisify(fs.rmdir);

test("Content script should handle include and exclude domain filter modes for all cases", async () => {
  const distPath = path.resolve(__dirname, "../../dist");
  const userDataDir = path.resolve(__dirname, "../../.tmp-user-data");
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${distPath}`,
      `--load-extension=${distPath}`,
    ],
  });

  const page = await context.newPage();
  const testDomain = "https://makinzm.github.io/rust-wasm-github/";

  // ユーティリティ関数: ドメインフィルターモードを設定
  async function setDomainFilterMode(
    mode: "include" | "exclude",
    domains: { domain: string }[]
  ) {
    const [bgWorker] = context.serviceWorkers();
    await bgWorker.evaluate(async (args) => {
      const { mode, domains } = args;
      chrome.storage.local.set({
        domainFilterMode: mode,
        ...(mode === "include"
          ? { included_domains: domains }
          : { excluded_domains: domains }),
      });
    }, { mode, domains });
  }

  // --- 1. Include モード: 機能するパターン ---
  await setDomainFilterMode("include", [{ domain: "makinzm.github.io" }]);
  await page.goto(testDomain);
  await page.waitForLoadState("domcontentloaded");

  await page.getByRole("heading", { name: "Hello World" }).dblclick();
  await page.waitForTimeout(1000);

  let button = await page.$("button[data-extension='cliplex']");
  expect(button).not.toBeNull(); // ボタンが生成される

  // --- 2. Include モード: 機能しないパターン ---
  await setDomainFilterMode("include", [{ domain: "" }]);
  await page.goto(testDomain);
  await page.waitForLoadState("domcontentloaded");

  await page.getByRole("heading", { name: "Hello World" }).dblclick();
  await page.waitForTimeout(1000);

  button = await page.$("button[data-extension='cliplex']");
  expect(button).toBeNull(); // ボタンが生成されない

  // --- 3. Exclude モード: 機能しないパターン ---
  await setDomainFilterMode("exclude", [{ domain: "makinzm.github.io" }]);
  await page.goto(testDomain);
  await page.waitForLoadState("domcontentloaded");

  await page.getByRole("heading", { name: "Hello World" }).dblclick();
  await page.waitForTimeout(1000);

  button = await page.$("button[data-extension='cliplex']");
  expect(button).toBeNull(); // ボタンが生成されない

  // --- 4. Exclude モード: 機能するパターン ---
  await setDomainFilterMode("exclude", [{ domain: "" }]);
  await page.goto(testDomain);
  await page.waitForLoadState("domcontentloaded");

  await page.getByRole("heading", { name: "Hello World" }).dblclick();
  await page.waitForTimeout(1000);

  button = await page.$("button[data-extension='cliplex']");
  expect(button).not.toBeNull(); // ボタンが生成される

  await context.close();
});

// テスト後のクリーンアップ
test.afterAll(async () => {
  const userDataDir = path.resolve(__dirname, "../../.tmp-user-data");
  if (fs.existsSync(userDataDir)) {
    await fs.promises.rm(userDataDir, { recursive: true });
    console.log("Removed user data directory:", userDataDir);
  }
});

