import { sessionService } from "@/lib/services/sessionService";
import type {
  ApiResponse,
  CreateSessionRequest,
  CreateSessionResponse,
} from "@/types/database";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 定数定義
const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 50;
const DEFAULT_QUESTIONS = 10;

// リクエストボディのバリデーション
const CreateSessionSchema = z.object({
  userId: z.string().min(1, "ユーザーIDが必要です"),
  totalQuestions: z
    .number()
    .min(MIN_QUESTIONS)
    .max(MAX_QUESTIONS)
    .optional()
    .default(DEFAULT_QUESTIONS),
});

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを解析
    const body = await request.json();
    const validation = CreateSessionSchema.safeParse(body);

    if (!validation.success) {
      // 全てのバリデーションエラーを含める
      const errorMessages = validation.error.errors.map((err) => err.message).join(", ");
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `バリデーションエラー: ${errorMessages}`,
        },
        { status: 400 }
      );
    }

    const { userId, totalQuestions } = validation.data;

    // サービス層でセッション作成（フォールバック機能付き）
    const sessionResponse = await sessionService.createSession(userId, totalQuestions);
    
    return NextResponse.json<ApiResponse<CreateSessionResponse>>({
      success: true,
      data: sessionResponse,
      message: `${totalQuestions}問のセッションを作成しました`,
    });
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

