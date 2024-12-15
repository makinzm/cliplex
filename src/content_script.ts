(async () => {
  const currentDomain = window.location.hostname;
  console.log(`Current domain: ${currentDomain}`);
  const storage = await chrome.storage.local.get('excluded_domains');
  const excludedDomains: DomainEntry[] = storage['excluded_domains'] || [];
  const isExcluded = excludedDomains.some(d => d.domain === currentDomain);
  
  if (isExcluded) {
    // ブロック対象のドメインなので、このコンテントスクリプトの機能を停止
    console.log(`This domain (${currentDomain}) is excluded from ClipLex.`);
    return;
  }

// スクロールしたときにボタンを消す
document.addEventListener('scroll', () => {
  const existingButton = document.querySelector('button[data-extension="cliplex"]');
  if (existingButton) {
    document.body.removeChild(existingButton);
  }
});

// 他の場所をクリックしたときにボタンを消す
document.addEventListener('click', (e) => {
  const existingButton = document.querySelector('button[data-extension="cliplex"]');
  if (existingButton && !existingButton.contains(e.target as Node)) {
    // クリックの位置と、ボタンの位置の距離が 50px 以上ならボタンを消す
    const rect = existingButton.getBoundingClientRect();
    const threshold = 50;
    if (e.clientX < rect.left - threshold || e.clientX > rect.right + threshold || e.clientY < rect.top - threshold || e.clientY > rect.bottom + threshold) {
      document.body.removeChild(existingButton);
    }
  }
});


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
  button.style.position = 'absolute';
  button.style.top = `${rect.bottom + window.scrollY}px`;
  button.style.left = `${rect.left + window.scrollX}px`;
  button.style.zIndex = '9999';
  button.style.background = 'transparent';
  button.style.border = 'none';
  button.style.cursor = 'pointer';

  const iconImg = document.createElement('img');
  iconImg.src = chrome.runtime.getURL('ui/icon.png');
  iconImg.alt = '保存';
  iconImg.style.width = '24px';
  iconImg.style.height = '24px';
  button.appendChild(iconImg);
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
      console.log('保存しました in cliplex');
    } else {
      alert('保存に失敗しました in cliplex');
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
})();
