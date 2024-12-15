// chrome.storage.localを使用するデータベースクラス
export class LocalDatabase {
  private STORAGE_KEY = 'word_entries';
  private EXCLUDED_DOMAIN_KEY = 'excluded_domains';

  public async getAll(): Promise<WordEntry[]> {
    console.log('Getting all entries from storage...');
    const result = await chrome.storage.local.get(this.STORAGE_KEY);
    console.log('All entries:', result);
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

  public async getAllExcludedDomains(): Promise<DomainEntry[]> {
    const result = await chrome.storage.local.get(this.EXCLUDED_DOMAIN_KEY);
    return result[this.EXCLUDED_DOMAIN_KEY] || [];
  }

  public async addExcludedDomain(domain: string): Promise<void> {
    const all = await this.getAllExcludedDomains();
    // 重複チェック
    if (!all.some((entry) => entry.domain === domain)) {
      all.push({ domain });
      await chrome.storage.local.set({ [this.EXCLUDED_DOMAIN_KEY]: all });
    }
  }

  public async removeExcludedDomain(domain: string): Promise<void> {
    const all = await this.getAllExcludedDomains();
    const newAll = all.filter((entry) => entry.domain !== domain);
    await chrome.storage.local.set({ [this.EXCLUDED_DOMAIN_KEY]: newAll });
  }
}

