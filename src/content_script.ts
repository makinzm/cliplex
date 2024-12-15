let excludedPatterns: string[] = [];

// content_scriptの初期化時にexcludedPatternsを読み込む
chrome.storage.local.get('excludedPatterns', (res) => {
  excludedPatterns = res['excludedPatterns'] || [];
});

document.addEventListener('mouseup', () => {
  // 現在のページURLをチェック
  const url = window.location.href;
  if (excludedPatterns.some(p => {
    try {
      const regex = new RegExp(p);
      return regex.test(url);
    } catch (e) {
      return false; // 正規表現が不正なら無視
    }
  })) {
    // 除外パターンにマッチするならボタン表示しない
    return;
  }
  const selection = window.getSelection();
  if (!selection) return;
  
  const text = selection.toString().trim();
  if (!text) return;  // テキストがない場合は何もしない

  // 選択範囲の位置を取得
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // 既存に作成されたボタンがあれば削除
  const existingButton = document.querySelector('button[data-extension="cliplex"]');
  if (existingButton) {
    document.body.removeChild(existingButton);
  }

  // 保存ボタンを生成
  const button = document.createElement('button');
  button.innerText = '保存';
  button.style.position = 'fixed';
  button.style.top = `${rect.bottom + window.scrollY}px`;
  button.style.left = `${rect.left + window.scrollX}px`;
  button.style.zIndex = '9999';
  button.style.background = '#ffd700';
  button.style.border = '1px solid #ccc';
  button.style.cursor = 'pointer';

  // 一意なセレクタを設定
  button.dataset.extension = 'cliplex';

  document.body.appendChild(button);

  type SaveEntryResponse = {
    status: string; // 'ok' など
  };

  // 保存ボタンをクリックしたときの処理
  button.addEventListener('click', async () => {
    const entry: WordEntry = {
      key: text,
      examples: [],
      note: '',
      addedDate: new Date().toISOString(),
      priority: 3,
    };
    const response = await new Promise<SaveEntryResponse>((resolve) => {
      chrome.runtime.sendMessage({ type: 'save_entry', entry }, (res) => {
        resolve(res);
      });
    });
    if (response && response.status === 'ok') {
      alert('保存しました');
    } else {
      alert('保存に失敗しました');
    }
    document.body.removeChild(button);
  });

  // 一定時間後にボタンを消す（任意）
  setTimeout(() => {
    if (document.body.contains(button)) {
      document.body.removeChild(button);
    }
  }, 5000);
});

