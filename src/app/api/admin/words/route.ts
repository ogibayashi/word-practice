import { validateApiKey } from "@/lib/middleware/apiKeyAuth";
import { wordManagementService } from "@/lib/services/wordManagementService";
import {
  AdminErrorCode,
  type AdminErrorResponse,
  type CreateWordRequest,
  type CreateWordResponse,
  type SearchWordsResponse,
} from "@/types/admin";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// バリデーションスキーマ
const CreateWordSchema = z.object({
  japanese_meaning: z
    .string()
    .min(1, "日本語の意味は必須です")
    .max(500, "日本語の意味は500文字以内です"),
  answers: z
    .array(
      z.string().min(1, "正解候補は空文字列にできません").max(255, "正解候補は255文字以内です")
    )
    .min(1, "正解候補は最低1つ必要です")
    .max(10, "正解候補は最大10個までです"),
  synonyms: z
    .array(z.string().min(1, "類義語は空文字列にできません").max(100, "類義語は100文字以内です"))
    .max(20, "類義語は最大20個までです")
    .optional(),
});

/**
 * POST /api/admin/words - 単語追加API
 */
export async function POST(request: NextRequest) {
  // APIキー認証
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    // リクエストボディを解析
    const body = await request.json();
    const validation = CreateWordSchema.safeParse(body);

    if (!validation.success) {
      const errorMessages = validation.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return NextResponse.json<AdminErrorResponse>(
        {
          success: false,
          error: {
            code: AdminErrorCode.VALIDATION_ERROR,
            message: `バリデーションエラー: ${errorMessages}`,
          },
        },
        { status: 400 }
      );
    }

    // 単語を作成
    const wordData = await wordManagementService.createWord({
      japanese_meaning: validation.data.japanese_meaning,
      answers: validation.data.answers,
      ...(validation.data.synonyms && { synonyms: validation.data.synonyms }),
    });

    return NextResponse.json<CreateWordResponse>(
      {
        success: true,
        data: wordData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create word:", error);

    // エラー種別に応じてレスポンスを変更
    if (error instanceof Error) {
      if (error.name === AdminErrorCode.DUPLICATE_WORD) {
        return NextResponse.json<AdminErrorResponse>(
          {
            success: false,
            error: {
              code: AdminErrorCode.DUPLICATE_WORD,
              message: error.message,
              details: {
                field: "japanese_meaning",
              },
            },
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json<AdminErrorResponse>(
      {
        success: false,
        error: {
          code: AdminErrorCode.DATABASE_ERROR,
          message: "単語の作成に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/words - 単語検索API
 */
export async function GET(request: NextRequest) {
  // APIキー認証
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    // クエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const isActive = (searchParams.get("is_active") as "true" | "false" | "all" | null) || "true";
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    // バリデーション
    if (limit < 1 || limit > 100) {
      return NextResponse.json<AdminErrorResponse>(
        {
          success: false,
          error: {
            code: AdminErrorCode.VALIDATION_ERROR,
            message: "limitは1から100の範囲で指定してください",
          },
        },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json<AdminErrorResponse>(
        {
          success: false,
          error: {
            code: AdminErrorCode.VALIDATION_ERROR,
            message: "offsetは0以上の値を指定してください",
          },
        },
        { status: 400 }
      );
    }

    if (!["true", "false", "all"].includes(isActive)) {
      return NextResponse.json<AdminErrorResponse>(
        {
          success: false,
          error: {
            code: AdminErrorCode.VALIDATION_ERROR,
            message: 'is_activeは"true"、"false"、または"all"のいずれかを指定してください',
          },
        },
        { status: 400 }
      );
    }

    // 単語を検索
    const result = await wordManagementService.searchWords({
      ...(search && { search }),
      is_active: isActive,
      limit,
      offset,
    });

    return NextResponse.json<SearchWordsResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to search words:", error);

    return NextResponse.json<AdminErrorResponse>(
      {
        success: false,
        error: {
          code: AdminErrorCode.DATABASE_ERROR,
          message: "単語の検索に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}
