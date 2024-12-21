declare global{

interface WordEntry {
  key: string;
  examples: string[];
  note: string;
  addedDate: string; // ISO形式 "2024-12-09T00:00:00Z" など
  priority: number; // 1〜5
}

interface DomainEntry {
  domain: string;
}

}

export {}; // モジュール化を回避するため
