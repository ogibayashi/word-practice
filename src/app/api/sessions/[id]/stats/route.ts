import { NextRequest, NextResponse } from "next/server";
import { getMockSessionStats } from "@/lib/db/mockSession";
import type { ApiResponse } from "@/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "セッションIDが指定されていません",
      }, { status: 400 });
    }

    // TODO: データベースが利用可能な場合はデータベース版を使用
    // 現在はモック版を使用
    const stats = getMockSessionStats(id);

    if (!stats) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "指定されたセッションが見つかりません",
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: stats,
      message: "セッション統計を取得しました",
    });

  } catch (error) {
    console.error("Failed to fetch session stats:", error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: "セッション統計の取得に失敗しました",
    }, { status: 500 });
  }
}