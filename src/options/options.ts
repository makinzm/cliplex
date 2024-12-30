import { LocalDatabase } from "../database";

const db = new LocalDatabase();

type FilterOptions = {
  from?: Date;
  to?: Date;
  prioritySort?: "asc" | "desc" | "";
};

let currentData: WordEntry[] = [];

const dateFromEl = document.getElementById("dateFrom") as HTMLInputElement;
const dateToEl = document.getElementById("dateTo") as HTMLInputElement;
const filterButton = document.getElementById("filterButton") as HTMLButtonElement;
const prioritySortEl = document.getElementById("prioritySort") as HTMLSelectElement;
const tableBody = document.getElementById("wordsTableBody") as HTMLTableSectionElement;

/** ========== 単語一覧をロード & フィルタ & ソート ========== */
async function loadData(filter: FilterOptions = {}) {
  let data = await db.getAll();

  // フィルタリング
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
        if (a.priority === b.priority) {
          return (
            new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()
          );
        }
        return a.priority - b.priority; // 優先度昇順
      } else {
        // desc
        if (a.priority === b.priority) {
          return (
            new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
          );
        }
        return b.priority - a.priority; // 優先度降順
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
  currentPage = 1; // フィルタ後は1ページ目に戻す
  renderTable();
}

/** ========== フィルタ条件変更時の処理 ========== */
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

/** ========== ページネーション ========== */
let currentPage = 1;
const rowsPerPage = 10; // 1ページあたりの表示数
const paginationContainer = document.getElementById("pagination") as HTMLDivElement;

function renderPagination() {
  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(currentData.length / rowsPerPage);

  // 前へボタン
  const prevButton = document.createElement("button");
  prevButton.textContent = "前へ";
  prevButton.className = "pagination-button";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      renderPagination();
    }
  });
  paginationContainer.appendChild(prevButton);

  // 次へボタン
  const nextButton = document.createElement("button");
  nextButton.textContent = "次へ";
  nextButton.className = "pagination-button";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      renderPagination();
    }
  });
  paginationContainer.appendChild(nextButton);
}

/** ========== テーブル描画 ========== */
function renderTable() {
  tableBody.innerHTML = "";
  const totalPages = Math.ceil(currentData.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = currentData.slice(start, end);

  for (const entry of pageData) {
    const tr = document.createElement("tr");

    // ---- リンク類の生成 ----
    const youglishLink = `https://youglish.com/pronounce/${encodeURIComponent(entry.key)}/english`;
    const playPhraseLink = `https://playphrase.me/#/search?q=${encodeURIComponent(entry.key)}`;
    const oxfordLink = `https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(entry.key)}`;
    const weblioLink = `https://ejje.weblio.jp/content/${encodeURIComponent(entry.key)}`;
    const yourDictLink = `https://www.yourdictionary.com/${encodeURIComponent(entry.key)}`;
    const hyperLink = `https://hypcol.marutank.net/?q=${encodeURIComponent(entry.key)}&d=f`;

    // ---- Key セル (編集ボタン付き) ----
    //   - デフォルトはテキスト表示 + 「編集」ボタン
    //   - クリックで input に変わる
    const keyCell = document.createElement("td");
    keyCell.className = "key-cell";

    const keySpan = document.createElement("span");
    keySpan.textContent = entry.key;

    const editKeyButton = document.createElement("button");
    editKeyButton.textContent = "編集";
    editKeyButton.addEventListener("click", () => {
      // input に切り替え
      const input = document.createElement("input");
      input.type = "text";
      input.value = entry.key;
      input.className = "edit-key-input";

      // 既存の keySpan, editKeyButton を隠す
      keySpan.classList.add("hidden");
      editKeyButton.classList.add("hidden");

      keyCell.appendChild(input);
      input.focus();

      // 編集終了時の処理
      const finishEdit = async () => {
        const newKey = input.value.trim();
        if (newKey && newKey !== entry.key) {
          // DB上は key が主キーなので、 oldKey を消して newKey で保存
          const oldKey = entry.key;
          entry.key = newKey;
          await db.delete(oldKey); // 古いキーを削除
          await db.save(entry);    // 新しいキーでセーブ
          console.log("キーを更新しました:", oldKey, "->", newKey);
        }
        // 入力フォームを消して元に戻す
        keyCell.removeChild(input);
        keySpan.textContent = entry.key;
        keySpan.classList.remove("hidden");
        editKeyButton.classList.remove("hidden");
        renderTable(); // テーブル再描画
      };

      // Enterキー or フォーカス外れたら終了
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          finishEdit();
        }
      });
      input.addEventListener("blur", () => {
        finishEdit();
      });
    });

    keyCell.appendChild(keySpan);
    keyCell.appendChild(editKeyButton);

    // ---- 辞書リンク
    const dictCell = document.createElement("td");
    dictCell.className = "link-cell";
    dictCell.innerHTML = `
      <ul>
        <li><a href="${oxfordLink}" target="_blank">Ox.</a></li>
        <li><a href="${weblioLink}" target="_blank">We.</a></li>
      </ul>
    `;

    // ---- 発音リンク
    const pronCell = document.createElement("td");
    pronCell.className = "link-cell";
    pronCell.innerHTML = `
      <ul>
        <li><a href="${youglishLink}" target="_blank">Youglish</a></li>
        <li><a href="${playPhraseLink}" target="_blank">P.P.</a></li>
      </ul>
    `;

    // ---- その他リンク
    const otherLinkCell = document.createElement("td");
    otherLinkCell.className = "link-cell";
    otherLinkCell.innerHTML = `
      <ul>
        <li><a href="${yourDictLink}" target="_blank">Y.D.</a></li>
        <li><a href="${hyperLink}" target="_blank">H.D.</a></li>
      </ul>
    `;

    // ---- 例文セル (追加 & 削除ボタンで自動保存)
    const exampleCell = document.createElement("td");
    const exList = document.createElement("ul");

    function renderExamples() {
      exList.innerHTML = "";
      entry.examples.forEach((ex, idx) => {
        const li = document.createElement("li");
        li.textContent = ex;

        const delBtn = document.createElement("button");
        delBtn.textContent = "削除";
        delBtn.style.marginLeft = "8px";
        delBtn.addEventListener("click", async () => {
          entry.examples.splice(idx, 1);
          await db.save(entry);
          renderTable(); // 再描画
        });

        li.appendChild(delBtn);
        exList.appendChild(li);
      });
    }
    renderExamples();

    const addExBtn = document.createElement("button");
    addExBtn.textContent = "追加";
    addExBtn.addEventListener("click", async () => {
      const newEx = prompt("新しい例文を入力してください:");
      if (newEx) {
        entry.examples.push(newEx);
        await db.save(entry);
        renderTable(); // 再描画
      }
    });

    exampleCell.appendChild(exList);
    exampleCell.appendChild(addExBtn);

    // ---- メモセル (自動保存)
    const noteCell = document.createElement("td");
    const noteArea = document.createElement("textarea");
    noteArea.className = "note-area";
    noteArea.value = entry.note || "";
    noteArea.rows = 2;
    noteArea.cols = 30;

    // note の変更を自動保存
    noteArea.addEventListener("change", async () => {
      entry.note = noteArea.value;
      await db.save(entry);
      console.log("メモを保存しました:", entry.note);
    });

    noteCell.appendChild(noteArea);

    // ---- 追加日
    const addedDateCell = document.createElement("td");
    addedDateCell.textContent = new Date(entry.addedDate).toLocaleString();

    // ---- 優先度 (自動保存)
    const priorityCell = document.createElement("td");
    const prioritySelect = document.createElement("select");
    [1, 2, 3, 4, 5].forEach((p) => {
      const opt = document.createElement("option");
      opt.value = String(p);
      opt.textContent = String(p);
      if (p === entry.priority) {
        opt.selected = true;
      }
      prioritySelect.appendChild(opt);
    });

    prioritySelect.addEventListener("change", async () => {
      entry.priority = Number(prioritySelect.value);
      await db.save(entry);
      console.log("優先度を保存しました:", entry.priority);
    });

    priorityCell.appendChild(prioritySelect);

    // ---- 操作セル (削除ボタンのみ)
    const actionCell = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.textContent = "削除";
    delBtn.addEventListener("click", async () => {
      await db.delete(entry.key);
      loadData(); // 再読み込み
    });

    actionCell.appendChild(delBtn);

    // ---- 行にセルを追加 ----
    tr.appendChild(keyCell);
    tr.appendChild(dictCell);
    tr.appendChild(pronCell);
    tr.appendChild(otherLinkCell);
    tr.appendChild(exampleCell);
    tr.appendChild(noteCell);
    tr.appendChild(addedDateCell);
    tr.appendChild(priorityCell);
    tr.appendChild(actionCell);

    tableBody.appendChild(tr);
  }

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
    .filter((ex) => ex); // 空を除去

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

  // 再描画
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
loadData();
loadDomainFilterMode();
setupDomainFilterModeListeners();

