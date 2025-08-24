import { getWordByIdWithFallback } from "@/lib/db/fallback";
import type { ApiResponse, QuestionData } from "@/types/database";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "単語IDが指定されていません",
        },
        { status: 400 }
      );
    }

    // 単語データを取得（データベース優先、モックデータフォールバック）
    const word = await getWordByIdWithFallback(id);

    if (!word) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "指定された単語が見つかりません",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<QuestionData>>({
      success: true,
      data: word,
      message: "単語データを取得しました",
    });
  } catch (error) {
    console.error("Failed to fetch word:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "単語の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
