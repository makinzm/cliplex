// tests/e2e/content_script.spec.ts
import { test, expect, chromium } from "@playwright/test";
import * as path from "path";

test("Content script should create a button when selecting 'World' text", async () => {
  // 拡張機能 dist フォルダへのパス (webpack build 後の出力先)
  const distPath = path.resolve(__dirname, "../../dist");

  // 永続化されたユーザーデータディレクトリ (一時的に作ると良い)
  const userDataDir = path.resolve(__dirname, "../../.tmp-user-data");

  // 拡張機能を起動したChromiumブラウザを立ち上げる
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // 動きを目視確認したい時は false (CIで動かすなら true でもOK)
    args: [
      `--disable-extensions-except=${distPath}`,
      `--load-extension=${distPath}`,
    ],
  });

  const page = await context.newPage();
  // テスト先のURLへアクセス
  await page.goto("https://makinzm.github.io/rust-wasm-github/");
  await page.waitForLoadState("domcontentloaded");

  // もしページ内に「Hello World」のテキストがあればクリックやダブルクリックで選択してみる。
  // ここではダブルクリックだけで選択できるか試す（要素次第で工夫が必要）。
  await page.getByRole('heading', { name: 'Hello World' }).dblclick();

  // コンテンツスクリプトの動作(ボタン生成など)を待つ
  // (本来は button[data-extension='cliplex'] が見つかるまで待つのがベター)
  await page.waitForTimeout(1000);

  // 生成されたはずのボタン要素を確認
  const button = await page.$("button[data-extension='cliplex']");
  expect(button).not.toBeNull();

  // ボタンをクリックして保存処理が走るか確認 (お試し)
  if (button) {
    await button.click();
    // 背景スクリプト or console.log をモニタリングしてレスポンスを確認する手法もあるが、
    // ひとまず「ボタンがクリックできる」ことまで確認する。
  }

  // クリック後、保存処理が走って background(script) が chrome.storage に書き込むはず
  // 少し待機（本番なら waitForEvent/message などを使うとベター）
  await page.waitForTimeout(1000);

  // MV3拡張機能の service worker(=background) を取得
  const [bgWorker] = context.serviceWorkers();
  expect(bgWorker).toBeTruthy();

  // service worker 上下で `chrome.storage.local.get` を実行
  // evaluate() は Service Worker のJS空間で動くので `chrome` が使える
  const storedEntries = await bgWorker.evaluate(async () => {
    return new Promise<string[]>((resolve) => {
      chrome.storage.local.get("word_entries", (res) => {
        const entries = res.word_entries || [];
        resolve(entries.map((e: any) => e.key)); // ここでは key だけ取り出す例
      });
    });
  });

  // "Hello World" が保存されているか確認
  // WARN: なぜか World だけが保存される場合があるので注意
  expect(storedEntries).toContain("World");

  await context.close();
});

