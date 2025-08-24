import { createMockSession } from "@/lib/db/mockSession";
import type { ApiResponse, CreateSessionRequest, CreateSessionResponse } from "@/types/database";
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

    // TODO: データベースが利用可能な場合はデータベース版を使用
    // 現在はモック版を使用
    const sessionResponse = createMockSession(userId, totalQuestions);

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
