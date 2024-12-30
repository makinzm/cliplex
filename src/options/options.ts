import { LocalDatabase } from "../database";

const db = new LocalDatabase();

type FilterOptions = {
  from?: Date;
  to?: Date;
  prioritySort?: "asc" | "desc" | "";
};

let currentData: WordEntry[] = [];

/** フィルタやソートに使う要素を取得 */
const dateFromEl = document.getElementById("dateFrom") as HTMLInputElement;
const dateToEl = document.getElementById("dateTo") as HTMLInputElement;
const filterButton = document.getElementById("filterButton") as HTMLButtonElement;
const prioritySortEl = document.getElementById("prioritySort") as HTMLSelectElement;

/** カードを格納するコンテナ */
const wordsContainer = document.getElementById("wordsContainer") as HTMLDivElement;

/** ページネーション関連 */
let currentPage = 1;
const rowsPerPage = 5; // 1ページあたりの表示数
const paginationContainer = document.getElementById("pagination") as HTMLDivElement;

/** ========== 単語一覧をロード & フィルタ & ソート ========== */
async function loadData(filter: FilterOptions = {}) {
  let data = await db.getAll();

  // 日付フィルタ
  if (filter.from) {
    data = data.filter((d) => new Date(d.addedDate) >= filter.from!);
  }
  if (filter.to) {
    data = data.filter((d) => new Date(d.addedDate) <= filter.to!);
  }

  // ソート（優先度ソート設定を適用）
  if (filter.prioritySort) {
    data.sort((a, b) => {
      if (filter.prioritySort === "asc") {
        // 優先度 昇順
        if (a.priority === b.priority) {
          // 同じ場合は追加日で昇順
          return (
            new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()
          );
        }
        return a.priority - b.priority;
      } else {
        // 優先度 降順
        if (a.priority === b.priority) {
          // 同じ場合は追加日で降順
          return (
            new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
          );
        }
        return b.priority - a.priority;
      }
    });
  } else {
    // デフォルトソート: 優先度降順、追加日降順
    data.sort((a, b) => {
      if (a.priority === b.priority) {
        return (
          new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );
      }
      return b.priority - a.priority;
    });
  }

  currentData = data;
  currentPage = 1; // フィルタすると先頭ページに戻す
  renderWords();
}

/** ========== カード描画 ========== */
/**
 * 1つのWordEntryをカードとして描画する
 */
function renderWordCard(entry: WordEntry) {
  const card = document.createElement("div");
  card.className = "word-card";

  // ---- ヘッダー部分
  const header = document.createElement("div");
  header.className = "word-header";

  // 優先度セクション
  const prioritySection = document.createElement("div");
  prioritySection.className = "priority-section";

  const priorityLabel = document.createElement("label");
  priorityLabel.textContent = "優先度:";
  prioritySection.appendChild(priorityLabel);

  const prioritySelect = document.createElement("select");
  prioritySelect.className = "priority-select";
  [5, 4, 3, 2, 1].forEach((p) => {
    const option = document.createElement("option");
    option.value = String(p);
    option.textContent = String(p);
    if (p === entry.priority) {
      option.selected = true;
    }
    prioritySelect.appendChild(option);
  });
  prioritySelect.addEventListener("change", async () => {
    entry.priority = Number(prioritySelect.value);
    await db.save(entry);
    console.log("優先度が変更されました:", entry.key, entry.priority);
    renderWords(); // 再描画
  });

  prioritySection.appendChild(prioritySelect);
  header.appendChild(prioritySection);

  // Wordタイトル
  const wordTitle = document.createElement("span");
  wordTitle.className = "word-title";
  wordTitle.textContent = entry.key;
  header.appendChild(wordTitle);

  // 削除ボタン
  const deleteWordButton = document.createElement("button");
  deleteWordButton.textContent = "削除";
  deleteWordButton.className = "delete-word-button";
  deleteWordButton.addEventListener("click", async () => {
    if (confirm("本当に削除しますか?")) {
      await db.delete(entry.key);
      loadData(); // 再読み込み
    }
  });

  header.appendChild(deleteWordButton);
  card.appendChild(header);

  // ---- 例文リスト
  const exampleList = document.createElement("ul");
  exampleList.className = "example-list";

  entry.examples.forEach((example, idx) => {
    const listItem = document.createElement("li");
    listItem.textContent = example;

    // 編集ボタン
    const editBtn = document.createElement("button");
    editBtn.textContent = "編集";
    editBtn.style.marginLeft = "8px";
    editBtn.addEventListener("click", async () => {
      const newEx = prompt("新しい例文を入力してください:", example);
      if (newEx !== null && newEx.trim() !== "") {
        entry.examples[idx] = newEx.trim();
        await db.save(entry);
        renderWords(); // 再描画
      }
    });

    // 例文削除ボタン
    const delBtn = document.createElement("button");
    delBtn.textContent = "削除";
    delBtn.style.marginLeft = "8px";
    delBtn.addEventListener("click", async () => {
      if (!confirm("本当に削除しますか?")) {
        return;
      }
      entry.examples.splice(idx, 1);
      await db.save(entry);
      renderWords(); // 再描画
    });

    listItem.appendChild(delBtn);
    listItem.appendChild(editBtn);
    exampleList.appendChild(listItem);
  });

  // 例文追加ボタン
  const addExampleBtn = document.createElement("button");
  addExampleBtn.className = "add-example-button";
  addExampleBtn.textContent = "例文を追加";
  addExampleBtn.addEventListener("click", async () => {
    const newEx = prompt("新しい例文を入力してください:");
    if (newEx) {
      entry.examples.push(newEx);
      await db.save(entry);
      renderWords(); // 再描画
    }
  });

  card.appendChild(exampleList);
  card.appendChild(addExampleBtn);

  // ---- メモセクション
  const noteSection = document.createElement("div");
  noteSection.className = "note-section";

  // textareaで編集
  const noteArea = document.createElement("textarea");
  noteArea.rows = 2;
  noteArea.cols = 30;
  noteArea.value = entry.note || "";
  noteArea.addEventListener("change", async () => {
    entry.note = noteArea.value;
    await db.save(entry);
    console.log("メモが更新されました:", entry.key, entry.note);
  });

  noteSection.appendChild(noteArea);
  card.appendChild(noteSection);

  // ---- カード下部にリンク
  const wordLinks = document.createElement("div");
  wordLinks.className = "word-links";

  const links = [
    { name: "Oxford", url: `https://www.oxfordlearnersdictionaries.com/definition/english/${entry.key}` },
    { name: "Weblio", url: `https://ejje.weblio.jp/content/${entry.key}` },
    { name: "Youglish", url: `https://youglish.com/pronounce/${entry.key}/english` },
    { name: "Play Phrase", url: `https://playphrase.me/#/search?q=${entry.key}` },
  ];

  links.forEach(({ name, url }) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.textContent = name;
    wordLinks.appendChild(a);
  });

  card.appendChild(wordLinks);

  // ---- 追加日など何か表示したければここに追記
  const addedDateInfo = document.createElement("div");
  addedDateInfo.style.fontSize = "0.8em";
  addedDateInfo.style.marginTop = "5px";
  addedDateInfo.textContent = `追加日: ${new Date(entry.addedDate).toLocaleString()}`;
  card.appendChild(addedDateInfo);

  wordsContainer.appendChild(card);
}

/** ========== ページネーション描画 ========== */
function renderPagination() {
  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(currentData.length / rowsPerPage);

  // 「前へ」ボタン
  const prevButton = document.createElement("button");
  prevButton.textContent = "前へ";
  prevButton.className = "pagination-button";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderWords();
    }
  });
  paginationContainer.appendChild(prevButton);

  // 「次へ」ボタン
  const nextButton = document.createElement("button");
  nextButton.textContent = "次へ";
  nextButton.className = "pagination-button";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderWords();
    }
  });
  paginationContainer.appendChild(nextButton);
}

/** ========== currentData からカードを描画 ========== */
function renderWords() {
  wordsContainer.innerHTML = "";
  const totalPages = Math.ceil(currentData.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = currentData.slice(start, end);

  pageData.forEach((entry) => {
    renderWordCard(entry);
  });

  renderPagination();
}

/** ========== フィルタボタン ========== */
filterButton.addEventListener("click", () => {
  const fromVal = dateFromEl.value ? new Date(dateFromEl.value) : undefined;
  const toVal = dateToEl.value ? new Date(dateToEl.value) : undefined;
  const priorityVal = prioritySortEl.value as "asc" | "desc" | "";

  loadData({
    from: fromVal,
    to: toVal,
    prioritySort: priorityVal,
  });
});

/** ========== ソート切り替えイベント ========== */
prioritySortEl.addEventListener("change", () => {
  const fromVal = dateFromEl.value ? new Date(dateFromEl.value) : undefined;
  const toVal = dateToEl.value ? new Date(dateToEl.value) : undefined;
  const priorityVal = prioritySortEl.value as "asc" | "desc" | "";

  loadData({
    from: fromVal,
    to: toVal,
    prioritySort: priorityVal,
  });
});

/** ========== 新規単語追加機能 ========== */
const newWordKeyEl = document.getElementById("newWordKey") as HTMLInputElement;
const newWordExamplesEl = document.getElementById("newWordExamples") as HTMLInputElement;
const newWordNoteEl = document.getElementById("newWordNote") as HTMLTextAreaElement;
const newWordPriorityEl = document.getElementById("newWordPriority") as HTMLSelectElement;
const addNewWordButton = document.getElementById("addNewWordButton") as HTMLButtonElement;

addNewWordButton.addEventListener("click", async () => {
  const key = newWordKeyEl.value.trim();
  if (!key) {
    alert("単語のキーが空です。入力してください。");
    return;
  }

  // 例文はカンマ区切りで受け取る
  const examples = newWordExamplesEl.value
    .split(",")
    .map((ex) => ex.trim())
    .filter((ex) => ex); // 空の要素を除外

  const note = newWordNoteEl.value || "";
  const priority = Number(newWordPriorityEl.value) || 3;

  const newEntry: WordEntry = {
    key,
    examples,
    note,
    priority,
    addedDate: new Date().toISOString(),
  };

  // DBに保存
  await db.save(newEntry);

  // フォームをリセット
  newWordKeyEl.value = "";
  newWordExamplesEl.value = "";
  newWordNoteEl.value = "";
  newWordPriorityEl.value = "3";

  // 再読み込み
  loadData();
});

/** ========== Exclude / Includeドメインリスト表示・操作 ========== */
const excludedDomainInput = document.getElementById("excludedDomainInput") as HTMLInputElement;
const addExcludedDomainButton = document.getElementById("addExcludedDomainButton") as HTMLButtonElement;
const excludedDomainList = document.getElementById("excludedDomainList") as HTMLUListElement;

async function renderExcludedDomains() {
  const domains = await db.getAllExcludedDomains();
  excludedDomainList.innerHTML = "";
  for (const d of domains) {
    const li = document.createElement("li");
    li.textContent = d.domain;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "削除";
    removeBtn.addEventListener("click", async () => {
      await db.removeExcludedDomain(d.domain);
      renderExcludedDomains();
    });
    li.appendChild(removeBtn);
    excludedDomainList.appendChild(li);
  }
}

addExcludedDomainButton.addEventListener("click", async () => {
  const domain = excludedDomainInput.value.trim();
  if (domain) {
    await db.addExcludedDomain(domain);
    excludedDomainInput.value = "";
    renderExcludedDomains();
  }
});

// ----- Include domains -----
const includedDomainInput = document.getElementById("includedDomainInput") as HTMLInputElement;
const addIncludedDomainButton = document.getElementById("addIncludedDomainButton") as HTMLButtonElement;
const includedDomainList = document.getElementById("includedDomainList") as HTMLUListElement;

async function renderIncludedDomains() {
  const domains = await db.getAllIncludedDomains();
  includedDomainList.innerHTML = "";
  for (const d of domains) {
    const li = document.createElement("li");
    li.textContent = d.domain;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "削除";
    removeBtn.addEventListener("click", async () => {
      await db.removeIncludedDomain(d.domain);
      renderIncludedDomains();
    });
    li.appendChild(removeBtn);
    includedDomainList.appendChild(li);
  }
}

addIncludedDomainButton.addEventListener("click", async () => {
  const domain = includedDomainInput.value.trim();
  if (domain) {
    await db.addIncludedDomain(domain);
    includedDomainInput.value = "";
    renderIncludedDomains();
  }
});

/** ========== ドメインフィルターモードの保存先キー ========== */
const DOMAIN_FILTER_MODE_KEY = "domainFilterMode";

/** ========== ラジオボタン要素 ========== */
const radioExclude = document.getElementById("radioExclude") as HTMLInputElement;
const radioInclude = document.getElementById("radioInclude") as HTMLInputElement;

/** ========== chrome.storage.local からモードを読み込んでUIに反映 ========== */
async function loadDomainFilterMode() {
  const result = await chrome.storage.local.get(DOMAIN_FILTER_MODE_KEY);
  const mode = result[DOMAIN_FILTER_MODE_KEY] ?? "exclude"; // デフォルト exclude
  if (mode === "include") {
    radioInclude.checked = true;
  } else {
    radioExclude.checked = true; // exclude
  }
}

/** ========== ラジオボタンの変更を検知して保存 ========== */
function setupDomainFilterModeListeners() {
  [radioExclude, radioInclude].forEach((radio) => {
    radio.addEventListener("change", async () => {
      if (radio.checked) {
        await chrome.storage.local.set({ [DOMAIN_FILTER_MODE_KEY]: radio.value });
      }
    });
  });
}

/** ========== exclude/include 切り替え 表示 ========== */
const excludeSettings = document.getElementById("excludeSettings") as HTMLDivElement;
const includeSettings = document.getElementById("includeSettings") as HTMLDivElement;

function toggleSettings(mode: "exclude" | "include") {
  if (mode === "exclude") {
    excludeSettings.style.display = "block";
    includeSettings.style.display = "none";
  } else {
    excludeSettings.style.display = "none";
    includeSettings.style.display = "block";
  }
  localStorage.setItem("domainFilterMode", mode);
}

// ラジオボタンのイベントリスナーで切り替え
radioExclude.addEventListener("change", () => toggleSettings("exclude"));
radioInclude.addEventListener("change", () => toggleSettings("include"));

function initializeSettings() {
  const storedMode = localStorage.getItem("domainFilterMode") || "include";
  if (storedMode === "exclude") {
    radioExclude.checked = true;
    toggleSettings("exclude");
  } else {
    radioInclude.checked = true;
    toggleSettings("include");
  }
}

/** ========== 初期化処理 ========== */
initializeSettings();
renderExcludedDomains();
renderIncludedDomains();
loadData(); // データ読込
loadDomainFilterMode();
setupDomainFilterModeListeners();

