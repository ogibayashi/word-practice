import type { QuestionData } from "@/types/database";
import { checkMockAnswer, getMockWordById, getRandomMockWords, mockWords } from "../mockData";

describe("mockData utilities", () => {
  describe("getRandomMockWords", () => {
    it("指定された数の単語をランダムに取得する", () => {
      const words = getRandomMockWords(5);
      expect(words).toHaveLength(5);

      // 各単語が適切なプロパティを持つことを確認
      words.forEach((word) => {
        expect(word).toHaveProperty("id");
        expect(word).toHaveProperty("japaneseMeaning");
        expect(word).toHaveProperty("answers");
        expect(word).toHaveProperty("synonyms");
        expect(Array.isArray(word.answers)).toBe(true);
        expect(Array.isArray(word.synonyms)).toBe(true);
      });
    });

    it("デフォルトで10個の単語を返す", () => {
      const words = getRandomMockWords();
      expect(words).toHaveLength(10);
    });

    it("利用可能な単語数を超える場合は全ての単語を返す", () => {
      const allWordsCount = mockWords.length;
      const words = getRandomMockWords(allWordsCount + 10);
      expect(words).toHaveLength(allWordsCount);
    });

    it("0個を指定した場合は空の配列を返す", () => {
      const words = getRandomMockWords(0);
      expect(words).toHaveLength(0);
    });
  });

  describe("getMockWordById", () => {
    it("存在するIDの単語を取得できる", () => {
      const word = getMockWordById("1");
      expect(word).not.toBeNull();
      expect(word?.id).toBe("1");
      expect(word?.japaneseMeaning).toBe("走る");
      expect(word?.answers).toContain("run");
    });

    it("存在しないIDの場合はnullを返す", () => {
      const word = getMockWordById("999");
      expect(word).toBeNull();
    });

    it("空文字のIDの場合はnullを返す", () => {
      const word = getMockWordById("");
      expect(word).toBeNull();
    });
  });

  describe("checkMockAnswer", () => {
    const testWord: QuestionData = {
      id: "1",
      japaneseMeaning: "走る",
      answers: ["run", "jog", "sprint"],
      synonyms: ["駆ける"],
    };

    it("正解の場合はtrueを返す", () => {
      expect(checkMockAnswer(testWord, "run")).toBe(true);
      expect(checkMockAnswer(testWord, "jog")).toBe(true);
      expect(checkMockAnswer(testWord, "sprint")).toBe(true);
    });

    it("大文字小文字を区別しない", () => {
      expect(checkMockAnswer(testWord, "RUN")).toBe(true);
      expect(checkMockAnswer(testWord, "Run")).toBe(true);
      expect(checkMockAnswer(testWord, "JOG")).toBe(true);
    });

    it("前後の空白を無視する", () => {
      expect(checkMockAnswer(testWord, " run ")).toBe(true);
      expect(checkMockAnswer(testWord, "  jog  ")).toBe(true);
    });

    it("不正解の場合はfalseを返す", () => {
      expect(checkMockAnswer(testWord, "walk")).toBe(false);
      expect(checkMockAnswer(testWord, "jump")).toBe(false);
      expect(checkMockAnswer(testWord, "fly")).toBe(false);
    });

    it("空文字の場合はfalseを返す", () => {
      expect(checkMockAnswer(testWord, "")).toBe(false);
      expect(checkMockAnswer(testWord, " ")).toBe(false);
    });

    it("部分一致では正解にならない", () => {
      expect(checkMockAnswer(testWord, "ru")).toBe(false);
      expect(checkMockAnswer(testWord, "running")).toBe(false);
    });
  });

  describe("mockWords data integrity", () => {
    it("全ての単語が必要なプロパティを持つ", () => {
      mockWords.forEach((word, index) => {
        expect(word.id).toBeDefined();
        expect(word.japaneseMeaning).toBeDefined();
        expect(word.answers).toBeDefined();
        expect(word.synonyms).toBeDefined();

        expect(Array.isArray(word.answers)).toBe(true);
        expect(Array.isArray(word.synonyms)).toBe(true);

        expect(word.answers.length).toBeGreaterThan(0);
        expect(word.japaneseMeaning.trim()).not.toBe("");
      });
    });

    it("IDが重複していない", () => {
      const ids = mockWords.map((word) => word.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("想定された数の単語がある", () => {
      expect(mockWords.length).toBeGreaterThanOrEqual(10);
    });
  });
});
