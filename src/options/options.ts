import { LocalDatabase } from "../database";

const db = new LocalDatabase();

type FilterOptions = {
  from?: Date;
  to?: Date;
  prioritySort?: "asc" | "desc" | "";
};

const dateFromEl = document.getElementById("dateFrom") as HTMLInputElement;
const dateToEl = document.getElementById("dateTo") as HTMLInputElement;
const filterButton = document.getElementById(
  "filterButton",
) as HTMLButtonElement;
const prioritySortEl = document.getElementById(
  "prioritySort",
) as HTMLSelectElement;
const tableBody = document.getElementById(
  "wordsTableBody",
) as HTMLTableSectionElement;

let currentData: WordEntry[] = [];

async function loadData(filter: FilterOptions = {}) {
  let data = await db.getAll();

  // フィルタリング
  if (filter.from) {
    data = data.filter((d) => new Date(d.addedDate) >= filter.from!);
  }
  if (filter.to) {
    data = data.filter((d) => new Date(d.addedDate) <= filter.to!);
  }

  // ソート（フィルタの優先度ソート設定を適用）
  if (filter.prioritySort) {
    data.sort((a, b) => {
      if (filter.prioritySort === "asc") {
        if (a.priority === b.priority) {
          return (
            new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()
          );
        }
        return a.priority - b.priority; // 優先度昇順
      } else if (filter.prioritySort === "desc") {
        if (a.priority === b.priority) {
          return (
            new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
          );
        }
        return b.priority - a.priority; // 優先度降順
      }
      return 0;
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
  renderTable();
}

let currentPage = 1;
const rowsPerPage = 10; // 1ページあたりの表示数
const paginationContainer = document.getElementById(
  "pagination",
) as HTMLDivElement;

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

function renderTable() {
  tableBody.innerHTML = "";
  const totalPages = Math.ceil(currentData.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = currentData.slice(start, end);

  for (const entry of pageData) {
    const tr = document.createElement("tr");

    // リンク
    const youglishLink = `https://youglish.com/pronounce/${encodeURIComponent(entry.key)}/english`;
    const playPhraseLink = `https://playphrase.me/#/search?q=${encodeURIComponent(entry.key)}`;
    const oxfordLink = `https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(entry.key)}`;
    const weblioLink = `https://ejje.weblio.jp/content/${encodeURIComponent(entry.key)}`;
    const yourDictLink = `https://www.yourdictionary.com/${encodeURIComponent(entry.key)}`;
    const hyperLink = `https://hypcol.marutank.net/?q=${encodeURIComponent(entry.key)}&d=f`;

    tr.innerHTML = `
      <td class="key-cell">${entry.key}</td>
      <td class="link-cell">
        <ul>
          <li><a href="${oxfordLink}" target="_blank">Ox.</a></li>
          <li><a href="${weblioLink}" target="_blank">We.</a></li>
        </ul>
      </td>
      <td class="link-cell">
        <ul>
          <li><a href="${youglishLink}" target="_blank">Youglish</a></li>
          <li><a href="${playPhraseLink}" target="_blank">P.P.</a></li>
        </ul>
      </td>
      <td class="link-cell">
        <ul>
          <li><a href="${yourDictLink}" target="_blank">Y.D.</a></li>
          <li><a href="${hyperLink}" target="_blank">H.D.</a></li>
        </ul>
      </td>
      <td>
        <ul>
          ${entry.examples
            .map(
              (ex, idx) => `
            <li>${ex} <button class="delete-example" data-index="${idx}">削除</button></li>
          `,
            )
            .join("")}
        </ul>
        <button class="add-example">追加</button>
      </td>
      <td>
        <textarea class="note-area">${entry.note}</textarea>
      </td>
      <td>${new Date(entry.addedDate).toLocaleString()}</td>
      <td>
        <select class="priority-select">
          ${[1, 2, 3, 4, 5].map((p) => `<option value="${p}" ${p === entry.priority ? "selected" : ""}>${p}</option>`).join("")}
        </select>
      </td>
      <td>
        <button class="save-changes">保存</button>
        <button class="delete-key">削除</button>
      </td>
    `;

    // 追加例文ボタン
    const addExBtn = tr.querySelector(".add-example") as HTMLButtonElement;
    addExBtn.addEventListener("click", () => {
      const newEx = prompt("新しい例文を入力してください:");
      if (newEx) {
        entry.examples.push(newEx);
        renderTable();
      }
    });

    // 例文削除ボタン
    const deleteButtons = tr.querySelectorAll(
      ".delete-example",
    ) as NodeListOf<HTMLButtonElement>;
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.getAttribute("data-index"));
        entry.examples.splice(index, 1); // 削除
        renderTable();
      });
    });

    // 保存ボタン
    const saveBtn = tr.querySelector(".save-changes") as HTMLButtonElement;
    saveBtn.addEventListener("click", async () => {
      const noteArea = tr.querySelector(".note-area") as HTMLTextAreaElement;
      const prioritySelect = tr.querySelector(
        ".priority-select",
      ) as HTMLSelectElement;
      entry.note = noteArea.value;
      entry.priority = Number(prioritySelect.value);
      await db.save(entry);
      console.log("保存しました");
    });

    // 削除ボタン
    const delBtn = tr.querySelector(".delete-key") as HTMLButtonElement;
    delBtn.addEventListener("click", async () => {
      await db.delete(entry.key);
      loadData();
    });

    tableBody.appendChild(tr);
  }

  renderPagination();
}

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

const excludedDomainInput = document.getElementById(
  "excludedDomainInput",
) as HTMLInputElement;
const addExcludedDomainButton = document.getElementById(
  "addExcludedDomainButton",
) as HTMLButtonElement;
const excludedDomainList = document.getElementById(
  "excludedDomainList",
) as HTMLUListElement;

// excludedDomainsリストの表示更新関数
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

// DOM要素取得
const includedDomainInput = document.getElementById("includedDomainInput") as HTMLInputElement;
const addIncludedDomainButton = document.getElementById("addIncludedDomainButton") as HTMLButtonElement;
const includedDomainList = document.getElementById("includedDomainList") as HTMLUListElement;

// included_domainsリストの表示更新関数
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

// Includeドメイン追加ボタンのイベントリスナー
addIncludedDomainButton.addEventListener("click", async () => {
  const domain = includedDomainInput.value.trim();
  if (domain) {
    await db.addIncludedDomain(domain);
    includedDomainInput.value = ""; // 入力欄をクリア
    renderIncludedDomains();
  }
});

// 1) モード保存先キーを決める
const DOMAIN_FILTER_MODE_KEY = "domainFilterMode";

// 2) ラジオボタン要素を取得
const radioExclude = document.getElementById("radioExclude") as HTMLInputElement;
const radioInclude = document.getElementById("radioInclude") as HTMLInputElement;

// 3) chrome.storage.local からモードを読み込んでUIに反映
async function loadDomainFilterMode() {
  const result = await chrome.storage.local.get(DOMAIN_FILTER_MODE_KEY);
  const mode = result[DOMAIN_FILTER_MODE_KEY] ?? "exclude"; // デフォルト exclude
  if (mode === "include") {
    radioInclude.checked = true;
  } else {
    radioExclude.checked = true; // exclude
  }
}

// 4) ラジオボタンの変更を検知して保存
function setupDomainFilterModeListeners() {
  [radioExclude, radioInclude].forEach(radio => {
    radio.addEventListener("change", async () => {
      if (radio.checked) {
        await chrome.storage.local.set({ [DOMAIN_FILTER_MODE_KEY]: radio.value });
      }
    });
  });
}


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
  // モードを保存
  localStorage.setItem("domainFilterMode", mode);
}

// ラジオボタンのイベントリスナー
radioExclude.addEventListener("change", () => toggleSettings("exclude"));
radioInclude.addEventListener("change", () => toggleSettings("include"));

initializeSettings();
renderExcludedDomains();
renderIncludedDomains();
loadData();
loadDomainFilterMode();
setupDomainFilterModeListeners();

