import { getWordsWithFallback } from "@/lib/db/fallback";
import type { ApiResponse, QuestionData } from "@/types/database";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータから問題数を取得（デフォルト10問）
    const searchParams = request.nextUrl.searchParams;
    const countParam = searchParams.get("count");
    const count = countParam ? Number(countParam) : 10;

    // 問題数の制限チェック
    if (count < 1 || count > 50) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "問題数は1〜50の範囲で指定してください",
        },
        { status: 400 }
      );
    }

    // 単語データを取得（データベース優先、モックデータフォールバック）
    const words = await getWordsWithFallback(count);

    if (words.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "利用可能な単語データがありません",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<QuestionData[]>>({
      success: true,
      data: words,
      message: `${words.length}問の単語を取得しました`,
    });
  } catch (error) {
    console.error("Failed to fetch random words:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "単語の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
