import { checkDomainFilterMode } from "./content_script_helper";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_SCRIPT") {
    sendResponse({ injected: true });
  }
});

// 既存: background.ts と通信して save するための Promiseラッパー関数
async function saveEntryToBackground(entry: WordEntry): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "save_entry", entry }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else if (!response || response.status !== "ok") {
        console.error("Failed to save:", response);
        reject(new Error("Failed to save entry"));
      } else {
        console.log("Saved entry:", entry);
        resolve();
      }
    });
  });
}

// 既存: 全ワードを取得するラッパー関数
async function getAllWordEntries(): Promise<WordEntry[]> {
  return new Promise<WordEntry[]>((resolve) => {
    chrome.storage.local.get(["word_entries"], (result) => {
      const all = result["word_entries"] || [];
      resolve(all);
    });
  });
}

(async () => {
  const currentDomain = window.location.hostname;
  console.log(`Current domain: ${currentDomain}`);

  // ドメインフィルタ判定
  const storage = await chrome.storage.local.get([
    "domainFilterMode", // "exclude" or "include"
    "excluded_domains",
    "included_domains",
  ]);
  const mode = storage["domainFilterMode"] ?? "exclude";
  const excludedDomains: DomainEntry[] = storage["excluded_domains"] || [];
  const includedDomains: DomainEntry[] = storage["included_domains"] || [];

  const shouldRun = checkDomainFilterMode(mode, excludedDomains, includedDomains, currentDomain);
  if (!shouldRun) {
    console.log("Content script blocked for this domain.");
    return;
  }

  document.addEventListener("scroll", () => {
    const existingButton = document.querySelector('button[data-extension="cliplex"]');
    if (existingButton) {
      document.body.removeChild(existingButton);
    }
    const sentenceButton = document.querySelector('button[data-extension="cliplex-sentence"]');
    if (sentenceButton) {
      document.body.removeChild(sentenceButton);
    }
  });

  document.addEventListener("click", (e) => {
    const existingButton = document.querySelector('button[data-extension="cliplex"]');
    const sentenceButton = document.querySelector('button[data-extension="cliplex-sentence"]');
    if (existingButton && !existingButton.contains(e.target as Node)) {
      const rect = existingButton.getBoundingClientRect();
      const threshold = 50;
      if (
        e.clientX < rect.left - threshold ||
        e.clientX > rect.right + threshold ||
        e.clientY < rect.top - threshold ||
        e.clientY > rect.bottom + threshold
      ) {
        document.body.removeChild(existingButton);
      }
    }
    if (sentenceButton && !sentenceButton.contains(e.target as Node)) {
      const rect = sentenceButton.getBoundingClientRect();
      const threshold = 50;
      if (
        e.clientX < rect.left - threshold ||
        e.clientX > rect.right + threshold ||
        e.clientY < rect.top - threshold ||
        e.clientY > rect.bottom + threshold
      ) {
        document.body.removeChild(sentenceButton);
      }
    }
  });

  // ★★★ テキスト選択時の処理（mouseup） ★★★
  document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();
    if (!text) return; // テキストがない場合は何もしない

    // === 選択範囲の座標を取得 ===
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // ------------------------------------
    // 従来の「保存ボタン」(icon.png) 生成
    // ------------------------------------
    const saveButton = document.createElement("button");
    saveButton.style.position = "absolute";
    saveButton.style.top = `${rect.bottom + window.scrollY}px`;
    saveButton.style.left = `${rect.left + window.scrollX}px`;
    saveButton.style.zIndex = "9999";
    saveButton.style.background = "transparent";
    saveButton.style.border = "none";
    saveButton.style.cursor = "pointer";

    const iconImg = document.createElement("img");
    iconImg.src = chrome.runtime.getURL("ui/icon.png"); // 従来アイコン
    iconImg.alt = "保存";
    iconImg.style.width = "24px";
    iconImg.style.height = "24px";
    saveButton.appendChild(iconImg);
    saveButton.dataset.extension = "cliplex";

    document.body.appendChild(saveButton);

    // ----------------------------
    // 新規追加: 「画像＋sentence」 ボタン (images.png)
    // ----------------------------
    const sentenceButton = document.createElement("button");
    sentenceButton.style.position = "absolute";
    // ちょっと右にずらすなど調整
    sentenceButton.style.top = `${rect.bottom + window.scrollY}px`;
    sentenceButton.style.left = `${rect.left + window.scrollX + 40}px`;
    sentenceButton.style.zIndex = "9999";
    sentenceButton.style.background = "transparent";
    sentenceButton.style.border = "none";
    sentenceButton.style.cursor = "pointer";

    const sentenceImg = document.createElement("img");
    sentenceImg.src = chrome.runtime.getURL("ui/sentence.png"); // 新しいアイコン
    sentenceImg.style.width = "24px";
    sentenceImg.style.height = "24px";
    sentenceButton.appendChild(sentenceImg);
    sentenceButton.dataset.extension = "cliplex-sentence";

    document.body.appendChild(sentenceButton);

    // ★★★ 「保存ボタン」クリック時の処理（従来）★★★
    saveButton.addEventListener("click", async () => {
      const entry: WordEntry = {
        key: text,
        examples: [],
        note: "",
        addedDate: new Date().toISOString(),
        priority: 3,
      };
      try {
        await saveEntryToBackground(entry);
        console.log("保存しました in cliplex");
      } catch (err) {
        console.error("保存に失敗しました in cliplex", err);
        alert("保存に失敗しました in cliplex");
      }
      // ↓↓↓ ボタンを消したくない場合はコメントアウト
      // document.body.removeChild(saveButton);
      // document.body.removeChild(sentenceButton);
    });

    // ★★★ 「画像＋sentence」 ボタンクリック時の処理 ★★★
    sentenceButton.addEventListener("click", async () => {
      try {
        // 1. 既存の全WordEntryを取得
        const allEntries = await getAllWordEntries();

        // 2. text に既存ワードが含まれるかをチェック
        let foundCount = 0;
        for (const entry of allEntries) {
          if (text.toLowerCase().includes(entry.key.toLowerCase())) {
            // 3. 当該ワードに例文を追加
            entry.examples.push(text);
            await saveEntryToBackground(entry);
            foundCount++;
          }
        }

        // 4. ひとつもヒットしなかった場合 -> 先頭ワードで新規登録
        if (foundCount === 0) {
          const firstWord = text.split(/\s+/)[0] || text;
          const newEntry: WordEntry = {
            key: firstWord,
            examples: [text],
            note: "",
            addedDate: new Date().toISOString(),
            priority: 3,
          };
          await saveEntryToBackground(newEntry);
          console.log("新規ワードを追加:", newEntry);
        }

      } catch (err) {
        console.error("画像＋sentence処理中にエラー:", err);
        alert("画像＋sentence処理中にエラーが発生しました。");
      }
      // ↓↓↓ ボタンを消したくない場合はコメントアウト
      // document.body.removeChild(saveButton);
      // document.body.removeChild(sentenceButton);
    });

    // ========== 5秒後に自動削除する処理もコメントアウト ==========
    // setTimeout(() => {
    //   if (document.body.contains(saveButton)) {
    //     document.body.removeChild(saveButton);
    //   }
    //   if (document.body.contains(sentenceButton)) {
    //     document.body.removeChild(sentenceButton);
    //   }
    // }, 5000);
  });
})();

