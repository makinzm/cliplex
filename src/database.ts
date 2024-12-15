// chrome.storage.localを使用するデータベースクラス
export class LocalDatabase {
  private STORAGE_KEY = 'word_entries';

  public async getAll(): Promise<WordEntry[]> {
    const result = await chrome.storage.local.get(this.STORAGE_KEY);
    return result[this.STORAGE_KEY] || [];
  }

  public async save(entry: WordEntry): Promise<void> {
    const all = await this.getAll();
    const existingIndex = all.findIndex((e) => e.key === entry.key);
    if (existingIndex > -1) {
      all[existingIndex] = entry;
    } else {
      all.push(entry);
    }
    await chrome.storage.local.set({ [this.STORAGE_KEY]: all });
  }

  public async delete(key: string): Promise<void> {
    const all = await this.getAll();
    const newAll = all.filter((e) => e.key !== key);
    await chrome.storage.local.set({ [this.STORAGE_KEY]: newAll });
  }
}

