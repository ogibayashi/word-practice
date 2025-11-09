import { parseWordsFromCSV } from "../csvParser";

describe("parseWordsFromCSV", () => {
  it("正常なCSVを解析できる", () => {
    const csv = `japanese_meaning,primary_answer,alternative_answers,synonyms
走る,run,"jog,sprint","駆ける,疾走"
美しい,beautiful,"pretty,gorgeous","きれい,素敵"`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.words).toHaveLength(2);
    expect(result.words?.[0]).toEqual({
      japanese_meaning: "走る",
      answers: ["run", "jog", "sprint"],
      synonyms: ["駆ける", "疾走"],
    });
    expect(result.words?.[1]).toEqual({
      japanese_meaning: "美しい",
      answers: ["beautiful", "pretty", "gorgeous"],
      synonyms: ["きれい", "素敵"],
    });
  });

  it("synonymsなしのCSVを解析できる", () => {
    const csv = `japanese_meaning,primary_answer,alternative_answers
走る,run,"jog,sprint"`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.words).toHaveLength(1);
    expect(result.words?.[0]).toEqual({
      japanese_meaning: "走る",
      answers: ["run", "jog", "sprint"],
    });
  });

  it("alternative_answersなしのCSVを解析できる", () => {
    const csv = `japanese_meaning,primary_answer,alternative_answers,synonyms
走る,run,,駆ける`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.words).toHaveLength(1);
    expect(result.words?.[0]).toEqual({
      japanese_meaning: "走る",
      answers: ["run"],
      synonyms: ["駆ける"],
    });
  });

  it("alternative_answersとsynonymsなしのCSVを解析できる", () => {
    const csv = `japanese_meaning,primary_answer
走る,run`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.words).toHaveLength(1);
    expect(result.words?.[0]).toEqual({
      japanese_meaning: "走る",
      answers: ["run"],
    });
  });

  it("空行は無視される", () => {
    const csv = `japanese_meaning,primary_answer

走る,run

美しい,beautiful
`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.words).toHaveLength(2);
  });

  it("エラー: japanese_meaningが空", () => {
    const csv = `japanese_meaning,primary_answer
,run`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors).toContain("行2: japanese_meaningは必須です");
  });

  it("エラー: primary_answerが空", () => {
    const csv = `japanese_meaning,primary_answer
走る,`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors).toContain("行2: primary_answerは必須です");
  });

  it("エラー: 正解候補が10個を超える", () => {
    const alternatives = Array.from({ length: 10 }, (_, i) => `answer${i}`).join(",");
    const csv = `japanese_meaning,primary_answer,alternative_answers
走る,run,"${alternatives}"`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("正解候補は最大10個までです");
  });

  it("エラー: 類義語が20個を超える", () => {
    const synonyms = Array.from({ length: 21 }, (_, i) => `synonym${i}`).join(",");
    const csv = `japanese_meaning,primary_answer,alternative_answers,synonyms
走る,run,,"${synonyms}"`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("類義語は最大20個までです");
  });

  it("エラー: 日本語の意味が500文字を超える", () => {
    const longText = "あ".repeat(501);
    const csv = `japanese_meaning,primary_answer
${longText},run`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("日本語の意味は500文字以内です");
  });

  it("エラー: 正解候補が255文字を超える", () => {
    const longAnswer = "a".repeat(256);
    const csv = `japanese_meaning,primary_answer
走る,${longAnswer}`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("正解候補は255文字以内です");
  });

  it("エラー: 類義語が100文字を超える", () => {
    const longSynonym = "あ".repeat(101);
    const csv = `japanese_meaning,primary_answer,alternative_answers,synonyms
走る,run,,"${longSynonym}"`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("類義語は100文字以内です");
  });

  it("エラー: 有効な単語データがない", () => {
    const csv = "japanese_meaning,primary_answer";

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors).toContain("有効な単語データが見つかりませんでした");
  });

  it("エラー: 単語が100個を超える", () => {
    const rows = Array.from({ length: 101 }, (_, i) => `単語${i},word${i}`).join("\n");
    const csv = `japanese_meaning,primary_answer\n${rows}`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain("一度に登録できる単語は最大100個までです");
  });

  it("複数のエラーを収集する", () => {
    const csv = `japanese_meaning,primary_answer
,run
走る,
美しい,beautiful`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain("行2: japanese_meaningは必須です");
    expect(result.errors).toContain("行3: primary_answerは必須です");
  });

  it("前後の空白をトリミングする", () => {
    const csv = `japanese_meaning,primary_answer,alternative_answers,synonyms
  走る  ,  run  ,"  jog  ,  sprint  ","  駆ける  ,  疾走  "`;

    const result = parseWordsFromCSV(csv);

    expect(result.success).toBe(true);
    expect(result.words?.[0]).toEqual({
      japanese_meaning: "走る",
      answers: ["run", "jog", "sprint"],
      synonyms: ["駆ける", "疾走"],
    });
  });
});
