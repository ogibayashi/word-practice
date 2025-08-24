// データベース接続フォールバック機能

import type { QuestionData } from "@/types/database";
import { prisma } from "./client";
import { checkMockAnswer, getMockWordById, getRandomMockWords } from "./mockData";
import { wordQueries } from "./queries";

// データベース接続をチェック
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$executeRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn("Database connection failed, falling back to mock data:", error);
    return false;
  }
}

// 単語を取得（データベース優先、フォールバック付き）
export async function getWordsWithFallback(limit = 10): Promise<QuestionData[]> {
  const isConnected = await isDatabaseConnected();

  if (isConnected) {
    try {
      return await wordQueries.getRandomWords(limit);
    } catch (error) {
      console.error("Failed to fetch words from database:", error);
      console.log("Falling back to mock data");
    }
  }

  // フォールバック: モックデータを使用
  return getRandomMockWords(limit);
}

// IDで単語を検索（データベース優先、フォールバック付き）
export async function getWordByIdWithFallback(id: string): Promise<QuestionData | null> {
  const isConnected = await isDatabaseConnected();

  if (isConnected) {
    try {
      const word = await wordQueries.findById(id);
      if (word) {
        return {
          id: word.id,
          japaneseMeaning: word.japaneseMeaning,
          answers: word.answers.map((a) => a.answer),
          synonyms: word.synonyms,
        };
      }
    } catch (error) {
      console.error("Failed to fetch word from database:", error);
      console.log("Falling back to mock data");
    }
  }

  // フォールバック: モックデータを使用
  return getMockWordById(id);
}

// 回答チェック（データベース優先、フォールバック付き）
export async function checkAnswerWithFallback(
  wordId: string,
  userAnswer: string
): Promise<boolean> {
  const word = await getWordByIdWithFallback(wordId);
  if (!word) return false;

  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  return word.answers.some((answer) => answer.toLowerCase() === normalizedUserAnswer);
}
