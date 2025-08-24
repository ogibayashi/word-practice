import { NextRequest, NextResponse } from "next/server";
import { getMockSession } from "@/lib/db/mockSession";
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
    const session = getMockSession(id);

    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "指定されたセッションが見つかりません",
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        sessionId: session.id,
        totalQuestions: session.totalQuestions,
        completedQuestions: session.completedQuestions,
        isCompleted: session.isCompleted,
        questions: session.questions,
      },
      message: "セッション情報を取得しました",
    });

  } catch (error) {
    console.error("Failed to fetch session:", error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: "セッションの取得に失敗しました",
    }, { status: 500 });
  }
}