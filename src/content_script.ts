document.addEventListener('copy', () => {
  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection) return;
    const text = selection.toString().trim();
    if (!text) return;

    // 選択範囲近くに保存アイコンを表示
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

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

    const handleClick = async () => {
      // 新規エントリの保存(デフォルト値)
      const entry: WordEntry = {
        key: text,
        examples: [],
        note: '',
        addedDate: new Date().toISOString(),
        priority: 3
      };
      await chrome.runtime.sendMessage({ type: 'save_entry', entry });
      document.body.removeChild(button);
    };
    button.addEventListener('click', handleClick, { once: true });

    // 数秒後に自動でボタンを消す処理（任意）
    setTimeout(() => {
      if (document.body.contains(button)) {
        document.body.removeChild(button);
      }
    }, 5000);
  }, 0);
});

