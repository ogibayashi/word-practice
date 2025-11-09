import { prisma } from "@/lib/db/client";
import {
  AdminErrorCode,
  type BatchWordError,
  type CreateWordRequest,
  type DeleteWordResponse,
  type PaginationInfo,
  type UpdateWordRequest,
  type WordDetailResponse,
  type WordListItem,
} from "@/types/admin";
import type { Word, WordAnswer } from "@prisma/client";

/**
 * 単語管理サービス
 * 単語の作成、更新、削除、検索などの業務ロジックを提供
 */
class WordManagementService {
  /**
   * 単語を作成
   * @throws Error バリデーションエラーまたは重複エラー
   */
  async createWord(data: CreateWordRequest): Promise<WordDetailResponse> {
    // 重複チェック
    const existingWord = await prisma.word.findFirst({
      where: {
        japaneseMeaning: data.japanese_meaning,
        isActive: true,
      },
    });

    if (existingWord) {
      const error = new Error("この日本語の意味は既に登録されています");
      error.name = AdminErrorCode.DUPLICATE_WORD;
      throw error;
    }

    // トランザクション内で単語と正解候補を作成
    const result = await prisma.$transaction(async (tx) => {
      // 単語を作成
      const word = await tx.word.create({
        data: {
          japaneseMeaning: data.japanese_meaning,
          synonyms: data.synonyms || [],
        },
      });

      // 正解候補を作成（最初の要素をis_primary: trueに設定）
      const wordAnswers = await Promise.all(
        data.answers.map((answer, index) =>
          tx.wordAnswer.create({
            data: {
              wordId: word.id,
              answer,
              isPrimary: index === 0,
            },
          })
        )
      );

      return { word, wordAnswers };
    });

    return this.formatWordDetailResponse(result.word, result.wordAnswers);
  }

  /**
   * 単語を更新
   * @throws Error バリデーションエラーまたは単語が見つからない
   */
  async updateWord(id: string, data: UpdateWordRequest): Promise<WordDetailResponse> {
    // 単語が存在するか確認
    const existingWord = await prisma.word.findUnique({
      where: { id },
    });

    if (!existingWord) {
      const error = new Error("指定された単語が見つかりません");
      error.name = AdminErrorCode.WORD_NOT_FOUND;
      throw error;
    }

    // 削除済みの単語は更新不可
    if (!existingWord.isActive) {
      const error = new Error("削除済みの単語は更新できません");
      error.name = AdminErrorCode.WORD_ALREADY_DELETED;
      throw error;
    }

    // japanese_meaningを更新する場合、重複チェック（自分以外）
    if (data.japanese_meaning) {
      const duplicateWord = await prisma.word.findFirst({
        where: {
          japaneseMeaning: data.japanese_meaning,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateWord) {
        const error = new Error("この日本語の意味は既に登録されています");
        error.name = AdminErrorCode.DUPLICATE_WORD;
        throw error;
      }
    }

    // トランザクション内で更新
    const result = await prisma.$transaction(async (tx) => {
      // 単語を更新
      const word = await tx.word.update({
        where: { id },
        data: {
          ...(data.japanese_meaning && { japaneseMeaning: data.japanese_meaning }),
          ...(data.synonyms !== undefined && { synonyms: data.synonyms }),
        },
      });

      // answersが提供された場合は全置換
      let wordAnswers: WordAnswer[];
      if (data.answers) {
        // 既存の正解候補を削除
        await tx.wordAnswer.deleteMany({
          where: { wordId: id },
        });

        // 新しい正解候補を作成
        wordAnswers = await Promise.all(
          data.answers.map((answer, index) =>
            tx.wordAnswer.create({
              data: {
                wordId: id,
                answer,
                isPrimary: index === 0,
              },
            })
          )
        );
      } else {
        // answersが提供されていない場合は既存のものを取得
        wordAnswers = await tx.wordAnswer.findMany({
          where: { wordId: id },
          orderBy: { isPrimary: "desc" },
        });
      }

      return { word, wordAnswers };
    });

    return this.formatWordDetailResponse(result.word, result.wordAnswers);
  }

  /**
   * 単語を削除（ソフトデリート）
   * @throws Error 単語が見つからない
   */
  async deleteWord(id: string): Promise<DeleteWordResponse["data"]> {
    // 単語が存在するか確認
    const existingWord = await prisma.word.findUnique({
      where: { id },
    });

    if (!existingWord) {
      const error = new Error("指定された単語が見つかりません");
      error.name = AdminErrorCode.WORD_NOT_FOUND;
      throw error;
    }

    // 既に削除済み
    if (!existingWord.isActive) {
      const error = new Error("この単語は既に削除されています");
      error.name = AdminErrorCode.WORD_ALREADY_DELETED;
      throw error;
    }

    // ソフトデリート
    const deletedWord = await prisma.word.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return {
      id: deletedWord.id,
      japanese_meaning: deletedWord.japaneseMeaning,
      is_active: false,
      deleted_at: deletedWord.deletedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * 単語を検索
   */
  async searchWords(params: {
    search?: string;
    is_active?: "true" | "false" | "all";
    limit?: number;
    offset?: number;
  }): Promise<{ words: WordListItem[]; pagination: PaginationInfo }> {
    const limit = Math.min(params.limit || 20, 100); // 最大100件
    const offset = params.offset || 0;

    // フィルタ条件を構築
    const where: {
      japaneseMeaning?: { contains: string };
      isActive?: boolean;
    } = {};

    if (params.search) {
      where.japaneseMeaning = { contains: params.search };
    }

    if (params.is_active === "true") {
      where.isActive = true;
    } else if (params.is_active === "false") {
      where.isActive = false;
    }
    // "all"の場合はフィルタなし

    // 総件数を取得
    const total = await prisma.word.count({ where });

    // 単語を取得
    const words = await prisma.word.findMany({
      where,
      include: {
        answers: {
          orderBy: { isPrimary: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    // レスポンス形式に変換
    const wordList: WordListItem[] = words.map((word) => ({
      id: word.id,
      japanese_meaning: word.japaneseMeaning,
      answers: word.answers.map((a) => a.answer),
      synonyms: word.synonyms,
      is_active: word.isActive,
      created_at: word.createdAt.toISOString(),
    }));

    const pagination: PaginationInfo = {
      total,
      limit,
      offset,
      has_next: offset + limit < total,
      total_pages: Math.ceil(total / limit),
    };

    return { words: wordList, pagination };
  }

  /**
   * 単語を一括作成（バッチ処理）
   * @throws Error トランザクション全体が失敗した場合
   * @returns 作成成功件数、失敗件数、エラー詳細
   */
  async batchCreateWords(
    words: CreateWordRequest[]
  ): Promise<{ created: number; failed: number; errors: BatchWordError[] }> {
    const errors: BatchWordError[] = [];
    let created = 0;

    try {
      // トランザクション内で全件処理（全件成功 or 全件失敗）
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < words.length; i++) {
          const wordData = words[i];
          if (!wordData) continue;

          try {
            // 重複チェック
            const existingWord = await tx.word.findFirst({
              where: {
                japaneseMeaning: wordData.japanese_meaning,
                isActive: true,
              },
            });

            if (existingWord) {
              errors.push({
                index: i,
                japanese_meaning: wordData.japanese_meaning,
                error: "この日本語の意味は既に登録されています",
              });
              continue;
            }

            // 単語を作成
            const word = await tx.word.create({
              data: {
                japaneseMeaning: wordData.japanese_meaning,
                synonyms: wordData.synonyms || [],
              },
            });

            // 正解候補を作成
            await Promise.all(
              wordData.answers.map((answer, index) =>
                tx.wordAnswer.create({
                  data: {
                    wordId: word.id,
                    answer,
                    isPrimary: index === 0,
                  },
                })
              )
            );

            created++;
          } catch (error) {
            // 個別エラーを記録
            errors.push({
              index: i,
              japanese_meaning: wordData.japanese_meaning,
              error: error instanceof Error ? error.message : "不明なエラー",
            });
          }
        }

        // エラーがある場合はロールバック
        if (errors.length > 0) {
          throw new Error("バッチ処理中にエラーが発生しました");
        }
      });

      return {
        created,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      // トランザクション全体が失敗
      return {
        created: 0,
        failed: words.length,
        errors,
      };
    }
  }

  /**
   * WordとWordAnswerをWordDetailResponseに変換
   */
  private formatWordDetailResponse(word: Word, wordAnswers: WordAnswer[]): WordDetailResponse {
    return {
      id: word.id,
      japanese_meaning: word.japaneseMeaning,
      answers: wordAnswers.map((a) => ({
        id: a.id,
        answer: a.answer,
        is_primary: a.isPrimary,
      })),
      synonyms: word.synonyms,
      is_active: word.isActive,
      created_at: word.createdAt.toISOString(),
      ...(word.deletedAt && { deleted_at: word.deletedAt.toISOString() }),
    };
  }
}

export const wordManagementService = new WordManagementService();
