import type { QuestionData, WordStats, WordWithAnswers } from "@/types/database";
import { Prisma } from "@prisma/client";
import { prisma } from "./client";

// ユーザー関連のクエリ
export const userQueries = {
  // ユーザーを作成または取得
  async findOrCreateUser(displayName: string, lineUserId?: string) {
    // 既存ユーザーをチェック
    if (lineUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { lineUserId },
      });
      if (existingUser) return existingUser;
    }

    // 新しいユーザーを作成
    return await prisma.user.create({
      data: {
        displayName,
        lineUserId: lineUserId || null,
      },
    });
  },

  // ユーザーIDでユーザーを取得
  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  },
};

// 単語関連のクエリ
export const wordQueries = {
  // ランダムに単語を取得（シンプル版、後で出題アルゴリズムに置き換え）
  async getRandomWords(limit = 10): Promise<QuestionData[]> {
    const words = await prisma.word.findMany({
      where: {
        isActive: true, // アクティブな単語のみ取得
      },
      take: limit,
      include: {
        answers: true,
      },
      orderBy: {
        createdAt: "desc", // 一旦新しい順、後でランダムに変更
      },
    });

    return words.map(
      (word): QuestionData => ({
        id: word.id,
        japaneseMeaning: word.japaneseMeaning,
        synonyms: word.synonyms,
        answers: word.answers.map((answer) => answer.answer),
      })
    );
  },

  // 単語IDで単語と回答を取得
  async findById(id: string): Promise<WordWithAnswers | null> {
    return await prisma.word.findUnique({
      where: { id },
      include: {
        answers: true,
      },
    });
  },

  // 回答の正誤判定
  checkAnswer(word: WordWithAnswers, userAnswer: string): boolean {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    return word.answers.some((answer) => answer.answer.toLowerCase() === normalizedUserAnswer);
  },
};

// セッション関連のクエリ
export const sessionQueries = {
  // 新しいセッションを作成
  async create(userId: string, totalQuestions = 10) {
    return await prisma.session.create({
      data: {
        userId,
        totalQuestions,
      },
    });
  },

  // セッションIDでセッションを取得
  async findById(id: string) {
    return await prisma.session.findUnique({
      where: { id },
      include: {
        learningHistory: true,
        user: true,
      },
    });
  },

  // セッションを完了状態に更新
  async complete(id: string) {
    return await prisma.session.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  },

  // 進捗を更新
  async updateProgress(id: string, completedQuestions: number) {
    return await prisma.session.update({
      where: { id },
      data: {
        completedQuestions,
      },
    });
  },
};

// 学習履歴関連のクエリ
export const learningHistoryQueries = {
  // 学習履歴を記録
  async create(
    userId: string,
    wordId: string,
    sessionId: string,
    isCorrect: boolean,
    userAnswer: string
  ) {
    return await prisma.learningHistory.create({
      data: {
        userId,
        wordId,
        sessionId,
        isCorrect,
        userAnswer,
      },
    });
  },

  // ユーザーの単語別統計を取得
  async getWordStats(userId: string): Promise<WordStats[]> {
    const stats = await prisma.$queryRaw<
      Array<{
        word_id: string;
        japanese_meaning: string;
        total_attempts: bigint;
        correct_attempts: bigint;
        incorrect_attempts: bigint;
        last_attempt_at: Date | null;
      }>
    >(
      Prisma.sql`
			SELECT 
				w.id as word_id,
				w.japanese_meaning,
				COUNT(lh.id)::bigint as total_attempts,
				COUNT(CASE WHEN lh.is_correct = true THEN 1 END)::bigint as correct_attempts,
				COUNT(CASE WHEN lh.is_correct = false THEN 1 END)::bigint as incorrect_attempts,
				MAX(lh.answered_at) as last_attempt_at
			FROM words w
			LEFT JOIN learning_history lh ON w.id = lh.word_id AND lh.user_id = ${userId}
			WHERE EXISTS (
				SELECT 1 FROM learning_history lh2 
				WHERE lh2.word_id = w.id AND lh2.user_id = ${userId}
			)
			GROUP BY w.id, w.japanese_meaning
			ORDER BY last_attempt_at DESC
		`
    );

    return stats.map((stat): WordStats => {
      const totalAttempts = Number(stat.total_attempts);
      const correctAttempts = Number(stat.correct_attempts);
      const incorrectAttempts = Number(stat.incorrect_attempts);

      return {
        wordId: stat.word_id,
        japaneseMeaning: stat.japanese_meaning,
        totalAttempts,
        correctAttempts,
        incorrectAttempts,
        accuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
        lastAttemptAt: stat.last_attempt_at,
      };
    });
  },
};
