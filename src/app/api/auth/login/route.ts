import { userQueries } from "@/lib/db/queries";
import type { ApiResponse } from "@/types/database";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// リクエストボディのバリデーション
const LoginSchema = z.object({
  displayName: z
    .string()
    .min(1, "名前を入力してください")
    .max(50, "名前は50文字以内で入力してください"),
});

// レスポンスの型定義
interface LoginResponse {
  user: {
    id: string;
    displayName: string;
    createdAt: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを解析
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      const errorMessages = validation.error.errors.map((err) => err.message).join(", ");
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `バリデーションエラー: ${errorMessages}`,
        },
        { status: 400 }
      );
    }

    const { displayName } = validation.data;

    try {
      // データベースにユーザーを作成（または既存ユーザーを取得）
      const user = await userQueries.findOrCreateUser(displayName);

      const responseData: LoginResponse = {
        user: {
          id: user.id,
          displayName: user.displayName,
          createdAt: user.createdAt.toISOString(),
        },
      };

      return NextResponse.json<ApiResponse<LoginResponse>>({
        success: true,
        data: responseData,
        message: "ログインしました",
      });
    } catch (dbError) {
      console.error("データベースエラー:", dbError);

      // データベース接続エラーの場合、ローカルIDを生成して返す（フォールバック）
      const fallbackUser = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        displayName,
        createdAt: new Date().toISOString(),
      };

      const responseData: LoginResponse = {
        user: fallbackUser,
      };

      return NextResponse.json<ApiResponse<LoginResponse>>({
        success: true,
        data: responseData,
        message: "ログインしました（オフラインモード）",
      });
    }
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "ログインに失敗しました",
      },
      { status: 500 }
    );
  }
}
