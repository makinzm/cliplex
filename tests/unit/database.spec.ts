// tests/unit/database.spec.ts
import { LocalDatabase } from "../../src/database";

// `chrome.storage` を呼び出す箇所を Jest でモック化する例
// ※ 簡易的なモック例。実際にはより入念な mockImplementation が必要
const mockSet = jest.fn();
const mockGet = jest.fn();

(global as any).chrome = {
  storage: {
    local: {
      set: mockSet,
      get: mockGet
    }
  }
};

describe("LocalDatabase Tests", () => {
  let db: LocalDatabase;

  beforeEach(() => {
    db = new LocalDatabase();
    jest.clearAllMocks();
  });

  it("should getAll() return empty array if no data stored", async () => {
    mockGet.mockResolvedValue({});
    const entries = await db.getAll();
    expect(entries).toEqual([]);
    expect(mockGet).toHaveBeenCalledWith("word_entries");
  });

  it("should save() a new entry", async () => {
    const dummyStored: WordEntry[] = [];
    mockGet.mockResolvedValue({ word_entries: dummyStored }); 
    mockSet.mockResolvedValue(undefined);

    const newEntry: WordEntry = {
      key: "test",
      examples: [],
      note: "",
      addedDate: new Date().toISOString(),
      priority: 3
    };

    await db.save(newEntry);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledTimes(1);
    const [[savedData]] = mockSet.mock.calls; 
    // savedData -> { word_entries: [ { key: 'test', ... } ] } のはず
    expect(savedData.word_entries).toHaveLength(1);
    expect(savedData.word_entries[0]).toMatchObject(newEntry);
  });
});

