import { validateApiKey } from "@/lib/middleware/apiKeyAuth";
import { wordManagementService } from "@/lib/services/wordManagementService";
import {
  AdminErrorCode,
  type AdminErrorResponse,
  type BatchCreateWordRequest,
  type BatchCreateWordResponse,
} from "@/types/admin";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// バリデーションスキーマ（既存のCreateWordSchemaと同じ）
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

const BatchCreateWordSchema = z.object({
  words: z
    .array(CreateWordSchema)
    .min(1, "wordsは最低1つ必要です")
    .max(100, "一度に登録できる単語は最大100個までです"),
});

/**
 * POST /api/admin/words/batch - 単語一括追加API
 */
export async function POST(request: NextRequest) {
  // APIキー認証
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    // リクエストボディを解析
    const body = await request.json();
    const validation = BatchCreateWordSchema.safeParse(body);

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

    // バッチ処理を実行（synonymsがundefinedの場合は除外）
    const wordsData = validation.data.words.map((word) => ({
      japanese_meaning: word.japanese_meaning,
      answers: word.answers,
      ...(word.synonyms !== undefined && { synonyms: word.synonyms }),
    }));
    const result = await wordManagementService.batchCreateWords(wordsData);

    // 部分的な失敗の場合は207 Multi-Status、全件失敗の場合は400を返す
    if (result.failed === validation.data.words.length) {
      return NextResponse.json<BatchCreateWordResponse>(
        {
          success: true,
          data: result,
        },
        { status: 400 }
      );
    }

    if (result.failed > 0) {
      return NextResponse.json<BatchCreateWordResponse>(
        {
          success: true,
          data: result,
        },
        { status: 207 } // Multi-Status
      );
    }

    // 全件成功の場合は201
    return NextResponse.json<BatchCreateWordResponse>(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to batch create words:", error);

    return NextResponse.json<AdminErrorResponse>(
      {
        success: false,
        error: {
          code: AdminErrorCode.DATABASE_ERROR,
          message: "データベースエラーが発生しました",
        },
      },
      { status: 500 }
    );
  }
}
