// tests/e2e/content_script.spec.ts
import { test, expect, chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as util from "util";

// 非同期でディレクトリを削除するためのユーティリティ
const rmdir = util.promisify(fs.rmdir);

test("Content script should create a button when selecting 'World' text if domein is included, then fail to create if domain is excluded", async () => {
  // 拡張機能 dist フォルダへのパス
  const distPath = path.resolve(__dirname, "../../dist");
  // 永続化されたユーザーデータディレクトリ
  const userDataDir = path.resolve(__dirname, "../../.tmp-user-data");

  // 1) Chromium起動
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${distPath}`,
      `--load-extension=${distPath}`,
    ],
  });

  const page = await context.newPage();
  await page.goto("https://makinzm.github.io/rust-wasm-github/");
  await page.waitForLoadState("domcontentloaded");

  // ========== (A) 押せるパターン ==========
  
  // 1) domainFilterMode を "exclude" にし、対象ドメインを included_domains に追加
  //    (Service Worker 上で chrome.storage.local.set)
  let [bgWorker] = context.serviceWorkers();
  await bgWorker.evaluate(async () => {
    chrome.storage.local.set({
      domainFilterMode: "include",
      included_domains: [{ domain: "makinzm.github.io" }]
      // excluded_domains: ... は関係なければ省略
    });
  });

  // リロードして Service Worker が再評価されるまで待つ
  await page.reload();
  await page.waitForLoadState("domcontentloaded");

  // 「Hello World」テキストをダブルクリックで選択
  await page.getByRole('heading', { name: 'Hello World' }).dblclick();
  // ボタン生成を(簡易的に)待つ
  await page.waitForTimeout(1000);

  // ボタンがあるか確認
  let button = await page.$("button[data-extension='cliplex']");
  expect(button).not.toBeNull(); // 押せる

  // ボタンをクリック
  if (button) {
    await button.click();
  }
  // 保存処理の後、少し待つ
  await page.waitForTimeout(1000);

  // Service Workerを取得し、実際にデータが入ったか確認
  [bgWorker] = context.serviceWorkers();
  expect(bgWorker).toBeTruthy();

  let storedEntries = await bgWorker.evaluate(async () => {
    return new Promise<string[]>((resolve) => {
      chrome.storage.local.get("word_entries", (res) => {
        const entries = res.word_entries || [];
        resolve(entries.map((e: any) => e.key));
      });
    });
  });
  // WARN: なぜか "Hello" が入っていないことがある
  expect(storedEntries).toContain("World");

  // ========== (B) 押せないパターン ==========

  // 2) domainFilterMode を "exclude" にし、対象ドメインを excluded_domains に追加
  //    (同じ Service Worker 上下で chrome.storage.local.set)
  [bgWorker] = context.serviceWorkers(); // 取り直してもOK
  await bgWorker.evaluate(async () => {
    chrome.storage.local.set({
      domainFilterMode: "exclude",
      excluded_domains: [{ domain: "makinzm.github.io" }]
      // included_domains: ... は関係なければ省略
    });
  });

  // 3) ページをリロード or 違うタブを開いて戻るなど、content_script が再評価される状況にする
  await page.reload();
  await page.waitForLoadState("domcontentloaded");

  // 4) 再度テキスト選択
  await page.getByRole('heading', { name: 'Hello World' }).dblclick();
  await page.waitForTimeout(1000);

  // 5) 今度はボタンが生成されないはず
  button = await page.$("button[data-extension='cliplex']");
  expect(button).toBeNull(); // 押せないことを確認

  await context.close();
});


// テスト後にユーザーデータディレクトリを削除
test.afterAll(async () => {
  const userDataDir = path.resolve(__dirname, "../../.tmp-user-data");
  if (fs.existsSync(userDataDir)) {
    await rmdir(userDataDir, { recursive: true });
    console.log("Removed user data directory:", userDataDir);
  }
})
