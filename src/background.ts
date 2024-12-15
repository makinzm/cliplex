import { LocalDatabase } from './database';

const db = new LocalDatabase();

chrome.runtime.onMessage.addListener(
  (message: any, sender, sendResponse) => {
    console.log('Message received in background:', message);
    if (message.type === 'save_entry') {
      db.save(message.entry).then(() => {
        sendResponse({ status: 'ok' });
      });
      return true; // 非同期レスポンス
    }
  }
);

