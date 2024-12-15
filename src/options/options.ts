import { LocalDatabase } from '../database';

const db = new LocalDatabase();

type FilterOptions = {
  from?: Date;
  to?: Date;
  prioritySort?: 'asc' | 'desc' | '';
};

const dateFromEl = document.getElementById('dateFrom') as HTMLInputElement;
const dateToEl = document.getElementById('dateTo') as HTMLInputElement;
const filterButton = document.getElementById('filterButton') as HTMLButtonElement;
const prioritySortEl = document.getElementById('prioritySort') as HTMLSelectElement;
const tableBody = document.getElementById('wordsTableBody') as HTMLTableSectionElement;

// 追加: 除外パターン関連要素
const excludePatternInput = document.getElementById('excludePatternInput') as HTMLInputElement;
const addPatternButton = document.getElementById('addPatternButton') as HTMLButtonElement;
const excludePatternsList = document.getElementById('excludePatternsList') as HTMLUListElement;

let currentData: WordEntry[] = [];
let excludePatterns: string[] = [];

async function loadData(filter: FilterOptions = {}) {
  console.log('Calling db.getAll() from options page...');
  let data = await db.getAll();
  console.log('Loaded data in options:', data);

  // 日付フィルタ
  if (filter.from) {
    data = data.filter(d => new Date(d.addedDate) >= filter.from!);
  }
  if (filter.to) {
    data = data.filter(d => new Date(d.addedDate) <= filter.to!);
  }

  // ソート
  data = data.sort((a, b) => {
    const dateCmp = new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
    return dateCmp;
  });

  if (filter.prioritySort) {
    data = data.sort((a, b) => {
      if (filter.prioritySort === 'asc') return a.priority - b.priority;
      else return b.priority - a.priority;
    });
  }

  currentData = data;
  renderTable();
}

function renderTable() {
  tableBody.innerHTML = '';
  for (const entry of currentData) {
    const tr = document.createElement('tr');
    const youglishLink = `https://youglish.com/pronounce/${encodeURIComponent(entry.key)}/english`;
    const oxfordLink = `https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(entry.key)}`;

    tr.innerHTML = `
      <td>${entry.key}</td>
      <td><a href="${youglishLink}" target="_blank">Youglish</a></td>
      <td><a href="${oxfordLink}" target="_blank">Oxford</a></td>
      <td>
        <ul>${entry.examples.map(ex => `<li>${ex}</li>`).join('')}</ul>
        <button class="add-example">追加</button>
      </td>
      <td>
        <textarea class="note-area">${entry.note}</textarea>
      </td>
      <td>${new Date(entry.addedDate).toLocaleString()}</td>
      <td>
        <select class="priority-select">
          ${[1,2,3,4,5].map(p => `<option value="${p}" ${p===entry.priority?'selected':''}>${p}</option>`).join('')}
        </select>
      </td>
      <td>
        <button class="save-changes">保存</button>
        <button class="delete-key">削除</button>
      </td>
    `;

    // イベントリスナー(追加例文、保存、削除)は元通り
    const addExBtn = tr.querySelector('.add-example') as HTMLButtonElement;
    addExBtn.addEventListener('click', () => {
      const newEx = prompt('新しい例文を入力してください:');
      if (newEx) {
        entry.examples.push(newEx);
        renderTable();
      }
    });

    const saveBtn = tr.querySelector('.save-changes') as HTMLButtonElement;
    saveBtn.addEventListener('click', async () => {
      const noteArea = tr.querySelector('.note-area') as HTMLTextAreaElement;
      const prioritySelect = tr.querySelector('.priority-select') as HTMLSelectElement;
      entry.note = noteArea.value;
      entry.priority = Number(prioritySelect.value);
      await db.save(entry);
      alert('保存しました');
    });

    const delBtn = tr.querySelector('.delete-key') as HTMLButtonElement;
    delBtn.addEventListener('click', async () => {
      await db.delete(entry.key);
      loadData(); 
    });

    tableBody.appendChild(tr);
  }
}

// 除外パターン関連
addPatternButton.addEventListener('click', async () => {
  const pattern = excludePatternInput.value.trim();
  if (!pattern) return;

  // 現在のパターン一覧を取得
  const current = await getExcludePatterns();
  current.push(pattern);
  await chrome.storage.local.set({ 'excludedPatterns': current });
  excludePatternInput.value = '';
  renderExcludePatterns();
});

async function renderExcludePatterns() {
  const patterns = await getExcludePatterns();
  excludePatterns = patterns;
  excludePatternsList.innerHTML = '';
  patterns.forEach((pat, index) => {
    const li = document.createElement('li');
    li.textContent = pat;
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '削除';
    deleteButton.addEventListener('click', async () => {
      const updated = patterns.filter((_, i) => i !== index);
      await chrome.storage.local.set({ 'excludedPatterns': updated });
      renderExcludePatterns();
    });
    li.appendChild(deleteButton);
    excludePatternsList.appendChild(li);
  });
}

async function getExcludePatterns(): Promise<string[]> {
  const result = await chrome.storage.local.get('excludedPatterns');
  return result['excludedPatterns'] || [];
}

// 初期化処理
filterButton.addEventListener('click', () => {
  const fromVal = dateFromEl.value ? new Date(dateFromEl.value) : undefined;
  const toVal = dateToEl.value ? new Date(dateToEl.value) : undefined;
  const priorityVal = prioritySortEl.value as 'asc'|'desc'|'';

  loadData({
    from: fromVal,
    to: toVal,
    prioritySort: priorityVal
  });
});

(async () => {
  await loadData();
  await renderExcludePatterns();
})();

