import { prisma as db } from "@/lib/db/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 学習履歴保存用のバリデーションスキーマ
const CreateLearningHistorySchema = z.object({
  userId: z.string().min(1, "ユーザーIDが必要です"),
  wordId: z.string().min(1, "単語IDが必要です"),
  sessionId: z.string().min(1, "セッションIDが必要です"),
  isCorrect: z.boolean(),
  userAnswer: z.string().optional(),
});

// 学習履歴取得用のクエリパラメータ
const GetLearningHistorySchema = z.object({
  userId: z.string().min(1, "ユーザーIDが必要です"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 50)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 0)),
});

/**
 * POST /api/learning-history
 * 学習履歴を保存する
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateLearningHistorySchema.parse(body);

    // 学習履歴を保存
    const learningHistory = await db.learningHistory.create({
      data: {
        userId: validatedData.userId,
        wordId: validatedData.wordId,
        sessionId: validatedData.sessionId,
        isCorrect: validatedData.isCorrect,
        userAnswer: validatedData.userAnswer ?? null,
      },
      include: {
        user: {
          select: { id: true, displayName: true },
        },
        word: {
          select: { id: true, japaneseMeaning: true },
          include: {
            answers: true,
          },
        },
        session: {
          select: { id: true, totalQuestions: true, completedQuestions: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: learningHistory,
    });
  } catch (error) {
    console.error("学習履歴保存エラー:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "バリデーションエラー",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "学習履歴の保存に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning-history?userId=xxx&limit=50&offset=0
 * ユーザーの学習履歴を取得する
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedParams = GetLearningHistorySchema.parse(queryParams);

    // 学習履歴を取得
    const learningHistory = await db.learningHistory.findMany({
      where: {
        userId: validatedParams.userId,
      },
      include: {
        word: {
          select: { id: true, japaneseMeaning: true },
          include: {
            answers: {
              select: { answer: true, isPrimary: true },
            },
          },
        },
        session: {
          select: { id: true, startedAt: true, isCompleted: true },
        },
      },
      orderBy: {
        answeredAt: "desc",
      },
      take: validatedParams.limit,
      skip: validatedParams.offset,
    });

    // 総件数を取得
    const totalCount = await db.learningHistory.count({
      where: {
        userId: validatedParams.userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        history: learningHistory,
        totalCount,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        hasMore: validatedParams.offset + validatedParams.limit < totalCount,
      },
    });
  } catch (error) {
    console.error("学習履歴取得エラー:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "クエリパラメータのバリデーションエラー",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "学習履歴の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
