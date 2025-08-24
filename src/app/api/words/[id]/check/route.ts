import { NextRequest, NextResponse } from "next/server";
import { checkAnswerWithFallback } from "@/lib/db/fallback";
import type { ApiResponse } from "@/types/database";
import { z } from "zod";

// リクエストボディのバリデーション
const CheckAnswerSchema = z.object({
  answer: z.string().min(1, "回答を入力してください"),
});

interface CheckAnswerResponse {
  isCorrect: boolean;
  userAnswer: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "単語IDが指定されていません",
      }, { status: 400 });
    }

    // リクエストボディを解析
    const body = await request.json();
    const validation = CheckAnswerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.error.errors[0]?.message || "無効なリクエストです",
      }, { status: 400 });
    }

    const { answer } = validation.data;

    // 回答をチェック（データベース優先、モックデータフォールバック）
    const isCorrect = await checkAnswerWithFallback(id, answer);

    return NextResponse.json<ApiResponse<CheckAnswerResponse>>({
      success: true,
      data: {
        isCorrect,
        userAnswer: answer,
      },
      message: isCorrect ? "正解です！" : "不正解です",
    });

  } catch (error) {
    console.error("Failed to check answer:", error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: "回答のチェックに失敗しました",
    }, { status: 500 });
  }
}