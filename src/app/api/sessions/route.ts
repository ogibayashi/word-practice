import { prisma as db } from "@/lib/db/client";
import { createMockSession } from "@/lib/db/mockSession";
import type {
  ApiResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  QuestionData,
} from "@/types/database";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// リクエストボディのバリデーション
const CreateSessionSchema = z.object({
  userId: z.string().min(1, "ユーザーIDが必要です"),
  totalQuestions: z.number().min(1).max(50).optional().default(10),
});

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを解析
    const body = await request.json();
    const validation = CreateSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.errors[0]?.message || "無効なリクエストです",
        },
        { status: 400 }
      );
    }

    const { userId, totalQuestions } = validation.data;

    // データベース接続チェック（モック版フォールバック）
    try {
      // データベース版の実装を試行
      const sessionResponse = await createSessionWithDatabase(userId, totalQuestions);
      return NextResponse.json<ApiResponse<CreateSessionResponse>>({
        success: true,
        data: sessionResponse,
        message: `${totalQuestions}問のセッションを作成しました`,
      });
    } catch (dbError) {
      console.warn("データベース接続エラー、モック版を使用:", dbError);

      // モック版にフォールバック
      const sessionResponse = createMockSession(userId, totalQuestions);
      return NextResponse.json<ApiResponse<CreateSessionResponse>>({
        success: true,
        data: sessionResponse,
        message: `${totalQuestions}問のセッションを作成しました (モック版)`,
      });
    }
  } catch (error) {
    console.error("Failed to create session:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "セッションの作成に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * データベース版のセッション作成処理
 */
async function createSessionWithDatabase(
  userId: string,
  totalQuestions: number
): Promise<CreateSessionResponse> {
  // ユーザーの存在確認（必要に応じて）
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }

  // セッションを作成
  const session = await db.session.create({
    data: {
      userId,
      totalQuestions,
    },
  });

  // 問題用の単語をランダムに取得
  // PostgreSQL の RANDOM() 関数を使用してランダム順序で取得
  const words = await db.$queryRaw<
    Array<{
      id: string;
      japaneseMeaning: string;
      synonyms: string[];
    }>
  >`
    SELECT id, japanese_meaning as "japaneseMeaning", synonyms
    FROM words 
    ORDER BY RANDOM() 
    LIMIT ${totalQuestions}
  `;

  if (words.length < totalQuestions) {
    throw new Error(
      `必要な単語数が不足しています（必要: ${totalQuestions}, 利用可能: ${words.length}）`
    );
  }

  // 単語IDを使って答えを取得
  const wordIds = words.map((w) => w.id);
  const answers = await db.wordAnswer.findMany({
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
  const questions: QuestionData[] = words.map((word) => ({
    id: word.id,
    japaneseMeaning: word.japaneseMeaning,
    answers: answersByWordId[word.id]?.map((answer) => answer.answer) || [],
    synonyms: word.synonyms || [], // Prismaスキーマから取得
  }));

  return {
    sessionId: session.id,
    totalQuestions: session.totalQuestions,
    questions,
  };
}
