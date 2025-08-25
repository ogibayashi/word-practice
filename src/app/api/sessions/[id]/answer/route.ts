import { prisma as db } from "@/lib/db/client";
import { submitMockAnswer } from "@/lib/db/mockSession";
import type { ApiResponse, SubmitAnswerRequest, SubmitAnswerResponse } from "@/types/database";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// リクエストボディのバリデーション
const SubmitAnswerSchema = z.object({
  wordId: z.string().min(1, "単語IDが必要です"),
  userAnswer: z.string().min(1, "回答を入力してください"),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "セッションIDが指定されていません",
        },
        { status: 400 }
      );
    }

    // リクエストボディを解析
    const body = await request.json();
    const validation = SubmitAnswerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.errors[0]?.message || "無効なリクエストです",
        },
        { status: 400 }
      );
    }

    const { wordId, userAnswer } = validation.data;

    // データベース接続チェック（モック版フォールバック）
    try {
      // データベース版の実装を試行
      const result = await submitAnswerWithDatabase(id, wordId, userAnswer);
      return NextResponse.json<ApiResponse<SubmitAnswerResponse>>({
        success: true,
        data: result,
        message: result.isCorrect ? "正解です！" : "不正解です",
      });
    } catch (dbError) {
      console.warn("データベース接続エラー、モック版を使用:", dbError);

      // モック版にフォールバック
      const result = submitMockAnswer(id, wordId, userAnswer);

      if (!result) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "回答の提出に失敗しました。セッションまたは問題が見つかりません。",
          },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<SubmitAnswerResponse>>({
        success: true,
        data: result,
        message: result.isCorrect ? "正解です！" : "不正解です",
      });
    }
  } catch (error) {
    console.error("Failed to submit answer:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "回答の提出に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * データベース版の回答提出処理（学習履歴保存機能統合）
 */
async function submitAnswerWithDatabase(
  sessionId: string,
  wordId: string,
  userAnswer: string
): Promise<SubmitAnswerResponse> {
  // セッション情報を取得
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, isCompleted: true },
  });

  if (!session) {
    throw new Error("セッションが見つかりません");
  }

  if (session.isCompleted) {
    throw new Error("このセッションは既に完了しています");
  }

  // 単語情報と正解候補を取得
  const word = await db.word.findUnique({
    where: { id: wordId },
    select: {
      id: true,
      japaneseMeaning: true,
      answers: {
        select: { answer: true, isPrimary: true },
      },
    },
  });

  if (!word) {
    throw new Error("単語が見つかりません");
  }

  // 正解判定
  const correctAnswers = word.answers.map((a: { answer: string; isPrimary: boolean }) =>
    a.answer.toLowerCase()
  );
  const userAnswerLower = userAnswer.toLowerCase().trim();
  const isCorrect = correctAnswers.includes(userAnswerLower);

  // トランザクション内で学習履歴保存とセッション更新を実行
  const result = await db.$transaction(async (tx) => {
    // 学習履歴を保存
    await tx.learningHistory.create({
      data: {
        userId: session.userId,
        wordId: wordId,
        sessionId: sessionId,
        isCorrect: isCorrect,
        userAnswer: userAnswer.trim(),
      },
    });

    // セッションの完了問題数を更新
    const updatedSession = await tx.session.update({
      where: { id: sessionId },
      data: {
        completedQuestions: {
          increment: 1,
        },
      },
      select: { completedQuestions: true, totalQuestions: true },
    });

    // セッション完了チェック
    if (updatedSession.completedQuestions >= updatedSession.totalQuestions) {
      await tx.session.update({
        where: { id: sessionId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    return {
      isCorrect,
      correctAnswers: word.answers.map((a: { answer: string; isPrimary: boolean }) => a.answer),
      userAnswer: userAnswer.trim(),
      synonyms: [], // TODO: 類義語対応時に実装
      completedQuestions: updatedSession.completedQuestions,
      totalQuestions: updatedSession.totalQuestions,
    };
  });

  return result;
}
