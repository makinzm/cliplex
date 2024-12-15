import { LocalDatabase } from './database';

const db = new LocalDatabase();

console.log('Background script started.');

chrome.runtime.onMessage.addListener(
  (message: any, sender, sendResponse) => {
    console.log('Message received in background:', message);
    if (message.type === 'save_entry') {
      db.save(message.entry).then(async () => {
        console.log('Entry saved successfully:', message.entry);
        const all = await db.getAll();
        console.log('All entries after save:', all);
        sendResponse({ status: 'ok' });
      });
      return true; // 非同期レスポンス
    }
  }
);

