import type { CreateWordRequest } from "@/types/admin";
import Papa from "papaparse";

/**
 * CSV行の型定義
 */
interface CSVRow {
  japanese_meaning: string;
  primary_answer: string;
  alternative_answers?: string;
  synonyms?: string;
}

/**
 * CSV解析結果
 */
export interface ParseResult {
  success: boolean;
  words?: CreateWordRequest[];
  errors?: string[];
}

/**
 * CSVファイルを解析して単語データに変換
 * @param csvContent CSV文字列
 * @returns 解析結果
 */
export function parseWordsFromCSV(csvContent: string): ParseResult {
  const errors: string[] = [];

  try {
    // CSVを解析
    const result = Papa.parse<CSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (result.errors.length > 0) {
      return {
        success: false,
        errors: result.errors.map(
          (err: Papa.ParseError) => `CSV解析エラー (行${err.row}): ${err.message}`
        ),
      };
    }

    // データを検証・変換
    const words: CreateWordRequest[] = [];

    for (let i = 0; i < result.data.length; i++) {
      const row = result.data[i];
      if (!row) continue;
      const rowNum = i + 2; // ヘッダー行を考慮して+2

      // 必須フィールドのチェック
      if (!row.japanese_meaning || row.japanese_meaning.trim() === "") {
        errors.push(`行${rowNum}: japanese_meaningは必須です`);
        continue;
      }

      if (!row.primary_answer || row.primary_answer.trim() === "") {
        errors.push(`行${rowNum}: primary_answerは必須です`);
        continue;
      }

      // answersの配列を構築
      const answers: string[] = [row.primary_answer.trim()];

      // alternative_answersがあれば追加
      if (row.alternative_answers && row.alternative_answers.trim() !== "") {
        const alternatives = row.alternative_answers
          .split(",")
          .map((a: string) => a.trim())
          .filter((a: string) => a !== "");
        answers.push(...alternatives);
      }

      // answersの個数チェック（1〜10個）
      if (answers.length > 10) {
        errors.push(`行${rowNum}: 正解候補は最大10個までです（現在${answers.length}個）`);
        continue;
      }

      // synonymsの配列を構築
      const synonyms: string[] = [];
      if (row.synonyms && row.synonyms.trim() !== "") {
        const synonymList = row.synonyms
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s !== "");
        synonyms.push(...synonymList);
      }

      // synonymsの個数チェック（0〜20個）
      if (synonyms.length > 20) {
        errors.push(`行${rowNum}: 類義語は最大20個までです（現在${synonyms.length}個）`);
        continue;
      }

      // 文字数チェック
      if (row.japanese_meaning.length > 500) {
        errors.push(`行${rowNum}: 日本語の意味は500文字以内です`);
        continue;
      }

      // answersの各要素の文字数チェック
      const invalidAnswers = answers.filter((a) => a.length > 255);
      if (invalidAnswers.length > 0) {
        errors.push(`行${rowNum}: 正解候補は255文字以内です`);
        continue;
      }

      // synonymsの各要素の文字数チェック
      const invalidSynonyms = synonyms.filter((s) => s.length > 100);
      if (invalidSynonyms.length > 0) {
        errors.push(`行${rowNum}: 類義語は100文字以内です`);
        continue;
      }

      // 単語データを追加
      words.push({
        japanese_meaning: row.japanese_meaning.trim(),
        answers,
        ...(synonyms.length > 0 && { synonyms }),
      });
    }

    // エラーがある場合は失敗として返す
    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    // 単語が1つもない場合
    if (words.length === 0) {
      return {
        success: false,
        errors: ["有効な単語データが見つかりませんでした"],
      };
    }

    // 最大100件までの制限
    if (words.length > 100) {
      return {
        success: false,
        errors: [`一度に登録できる単語は最大100個までです（現在${words.length}個）`],
      };
    }

    return {
      success: true,
      words,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "CSV解析中に不明なエラーが発生しました"],
    };
  }
}
