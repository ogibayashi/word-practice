import { AdminErrorCode, type AdminErrorResponse } from "@/types/admin";
import { type NextRequest, NextResponse } from "next/server";

/**
 * APIキー認証ミドルウェア
 * Authorization: Bearer <API_KEY> ヘッダーでAPIキーを検証
 */
export function validateApiKey(request: NextRequest): NextResponse<AdminErrorResponse> | null {
  const authHeader = request.headers.get("authorization");
  const adminApiKey = process.env.ADMIN_API_KEY;

  // 環境変数が設定されていない場合
  if (!adminApiKey) {
    console.error("ADMIN_API_KEY environment variable is not set");
    return NextResponse.json<AdminErrorResponse>(
      {
        success: false,
        error: {
          code: AdminErrorCode.INVALID_API_KEY,
          message: "API認証が正しく設定されていません",
        },
      },
      { status: 500 }
    );
  }

  // Authorizationヘッダーが存在しない場合
  if (!authHeader) {
    return NextResponse.json<AdminErrorResponse>(
      {
        success: false,
        error: {
          code: AdminErrorCode.INVALID_API_KEY,
          message: "認証ヘッダーが必要です",
        },
      },
      { status: 401 }
    );
  }

  // Bearer形式のチェック
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return NextResponse.json<AdminErrorResponse>(
      {
        success: false,
        error: {
          code: AdminErrorCode.INVALID_API_KEY,
          message: "無効な認証形式です。Bearer形式を使用してください",
        },
      },
      { status: 401 }
    );
  }

  // APIキーの検証
  if (token !== adminApiKey) {
    return NextResponse.json<AdminErrorResponse>(
      {
        success: false,
        error: {
          code: AdminErrorCode.INVALID_API_KEY,
          message: "無効なAPIキーです",
        },
      },
      { status: 401 }
    );
  }

  // 認証成功
  return null;
}
