document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (!selection) return;
  
  const text = selection.toString().trim();
  if (!text) return;  // テキストがない場合は何もしない

  // 選択範囲の位置を取得
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

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

