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

    // TODO: データベースが利用可能な場合はデータベース版を使用
    // 現在はモック版を使用
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
