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

let currentData: WordEntry[] = [];

async function loadData(filter: FilterOptions = {}) {
  console.log('Calling db.getAll() from options page...');
  let data = await db.getAll();
  console.log('Data loaded:', data);
  // 日付フィルタ
  if (filter.from) {
    data = data.filter(d => new Date(d.addedDate) >= filter.from!);
  }
  if (filter.to) {
    data = data.filter(d => new Date(d.addedDate) <= filter.to!);
  }
  // ソート
  data = data.sort((a, b) => {
    // デフォルトは追加日順(降順とするなら以下を変更)
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

    // 追加例文ボタン
    const addExBtn = tr.querySelector('.add-example') as HTMLButtonElement;
    addExBtn.addEventListener('click', () => {
      const newEx = prompt('新しい例文を入力してください:');
      if (newEx) {
        entry.examples.push(newEx);
        renderTable();
      }
    });

    // 保存ボタン
    const saveBtn = tr.querySelector('.save-changes') as HTMLButtonElement;
    saveBtn.addEventListener('click', async () => {
      const noteArea = tr.querySelector('.note-area') as HTMLTextAreaElement;
      const prioritySelect = tr.querySelector('.priority-select') as HTMLSelectElement;
      entry.note = noteArea.value;
      entry.priority = Number(prioritySelect.value);
      await db.save(entry);
      alert('保存しました');
    });

    // 削除ボタン
    const delBtn = tr.querySelector('.delete-key') as HTMLButtonElement;
    delBtn.addEventListener('click', async () => {
      await db.delete(entry.key);
      loadData(); 
    });

    tableBody.appendChild(tr);
  }
}

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

const excludedDomainInput = document.getElementById('excludedDomainInput') as HTMLInputElement;
const addExcludedDomainButton = document.getElementById('addExcludedDomainButton') as HTMLButtonElement;
const excludedDomainList = document.getElementById('excludedDomainList') as HTMLUListElement;

// excludedDomainsリストの表示更新関数
async function renderExcludedDomains() {
  const domains = await db.getAllExcludedDomains();
  excludedDomainList.innerHTML = '';
  for (const d of domains) {
    const li = document.createElement('li');
    li.textContent = d.domain;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '削除';
    removeBtn.addEventListener('click', async () => {
      await db.removeExcludedDomain(d.domain);
      renderExcludedDomains();
    });
    li.appendChild(removeBtn);
    excludedDomainList.appendChild(li);
  }
}

addExcludedDomainButton.addEventListener('click', async () => {
  const domain = excludedDomainInput.value.trim();
  if (domain) {
    await db.addExcludedDomain(domain);
    excludedDomainInput.value = '';
    renderExcludedDomains();
  }
});


renderExcludedDomains();
loadData();

