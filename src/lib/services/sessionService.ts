import type { CreateSessionResponse, QuestionData } from "@/types/database";
import { prisma } from "@/lib/db/client";
import { createMockSession } from "@/lib/db/mockSession";
import { userQueries, sessionQueries } from "@/lib/db/queries";

/**
 * セッション管理サービス
 * ビジネスロジックを含むセッション関連の操作を提供
 */
export class SessionService {
  /**
   * セッションを作成し、問題も含めて返す
   * フォールバック機能付き（DB接続失敗時はモック版を使用）
   */
  async createSession(userId: string, totalQuestions: number): Promise<CreateSessionResponse> {
    try {
      return await this.createSessionWithDatabase(userId, totalQuestions);
    } catch (dbError) {
      console.warn("データベース接続エラー、モック版を使用:", dbError);
      return createMockSession(userId, totalQuestions);
    }
  }

  /**
   * データベースを使用したセッション作成
   * 内部メソッド
   */
  private async createSessionWithDatabase(
    userId: string,
    totalQuestions: number
  ): Promise<CreateSessionResponse> {
    // ビジネスルール1: ユーザーの存在確認
    await this.validateUser(userId);

    // ビジネスルール2: 出題可能な単語数の確認
    await this.validateWordCount(totalQuestions);

    // セッション作成
    const session = await sessionQueries.create(userId, totalQuestions);

    // ランダムな問題を取得
    const questions = await this.getRandomQuestions(totalQuestions);

    return {
      sessionId: session.id,
      totalQuestions: session.totalQuestions,
      questions,
    };
  }

  /**
   * ユーザーの存在確認
   * ビジネスルール: 存在しないユーザーはセッションを作成できない
   */
  private async validateUser(userId: string): Promise<void> {
    const user = await userQueries.findById(userId);
    if (!user) {
      throw new Error("ユーザーが見つかりません");
    }
  }

  /**
   * 出題可能な単語数の確認
   * ビジネスルール: 必要な問題数分の単語がデータベースに存在する必要がある
   */
  private async validateWordCount(totalQuestions: number): Promise<void> {
    const wordCount = await prisma.word.count();
    if (wordCount < totalQuestions) {
      throw new Error(
        `必要な単語数が不足しています（必要: ${totalQuestions}, 利用可能: ${wordCount}）`
      );
    }
  }

  /**
   * ランダムな問題を取得
   * 将来的には出題アルゴリズム（過去正解:過去不正解:新規 = 2:4:4）に置き換え予定
   */
  private async getRandomQuestions(totalQuestions: number): Promise<QuestionData[]> {
    // 全単語数を取得（バリデーション済み）
    const wordCount = await prisma.word.count();

    // ランダムなオフセットを生成してランダム取得
    const randomOffset = Math.floor(Math.random() * Math.max(1, wordCount - totalQuestions + 1));
    const words = await prisma.word.findMany({
      skip: randomOffset,
      take: totalQuestions,
      select: {
        id: true,
        japaneseMeaning: true,
        synonyms: true,
      },
    });

    // 単語IDを使って答えを取得
    const wordIds = words.map((w) => w.id);
    const answers = await prisma.wordAnswer.findMany({
      where: {
        wordId: { in: wordIds },
      },
      select: {
        wordId: true,
        answer: true,
        isPrimary: true,
      },
    });

    // wordIdでグループ化
    const answersByWordId = answers.reduce(
      (acc, answer) => {
        if (!acc[answer.wordId]) {
          acc[answer.wordId] = [];
        }
        acc[answer.wordId]!.push(answer);
        return acc;
      },
      {} as Record<string, Array<{ answer: string; isPrimary: boolean }>>
    );

    // QuestionData形式に変換
    return words.map((word): QuestionData => ({
      id: word.id,
      japaneseMeaning: word.japaneseMeaning,
      answers: answersByWordId[word.id]?.map((answer) => answer.answer) || [],
      synonyms: word.synonyms || [],
    }));
  }
}

// シングルトンインスタンスをエクスポート
export const sessionService = new SessionService();