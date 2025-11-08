import { validateApiKey } from "@/lib/middleware/apiKeyAuth";
import { wordManagementService } from "@/lib/services/wordManagementService";
import {
  AdminErrorCode,
  type AdminErrorResponse,
  type DeleteWordResponse,
  type UpdateWordRequest,
  type UpdateWordResponse,
} from "@/types/admin";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// バリデーションスキーマ
const UpdateWordSchema = z.object({
  japanese_meaning: z
    .string()
    .min(1, "日本語の意味は1文字以上必要です")
    .max(500, "日本語の意味は500文字以内です")
    .optional(),
  answers: z
    .array(
      z.string().min(1, "正解候補は空文字列にできません").max(255, "正解候補は255文字以内です")
    )
    .min(1, "正解候補は最低1つ必要です")
    .max(10, "正解候補は最大10個までです")
    .optional(),
  synonyms: z
    .array(z.string().min(1, "類義語は空文字列にできません").max(100, "類義語は100文字以内です"))
    .max(20, "類義語は最大20個までです")
    .optional(),
});

/**
 * PUT /api/admin/words/:id - 単語更新API
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // APIキー認証
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = params;

    // リクエストボディを解析
    const body = await request.json();
    const validation = UpdateWordSchema.safeParse(body);

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

    // 少なくとも1つのフィールドが必要
    if (
      !validation.data.japanese_meaning &&
      !validation.data.answers &&
      validation.data.synonyms === undefined
    ) {
      return NextResponse.json<AdminErrorResponse>(
        {
          success: false,
          error: {
            code: AdminErrorCode.MISSING_FIELDS,
            message:
              "少なくとも1つのフィールド(japanese_meaning, answers, synonyms)を指定してください",
          },
        },
        { status: 400 }
      );
    }

    // 単語を更新
    const wordData = await wordManagementService.updateWord(id, {
      ...(validation.data.japanese_meaning && {
        japanese_meaning: validation.data.japanese_meaning,
      }),
      ...(validation.data.answers && { answers: validation.data.answers }),
      ...(validation.data.synonyms !== undefined && { synonyms: validation.data.synonyms }),
    });

    return NextResponse.json<UpdateWordResponse>({
      success: true,
      data: wordData,
    });
  } catch (error) {
    console.error("Failed to update word:", error);

    // エラー種別に応じてレスポンスを変更
    if (error instanceof Error) {
      if (error.name === AdminErrorCode.WORD_NOT_FOUND) {
        return NextResponse.json<AdminErrorResponse>(
          {
            success: false,
            error: {
              code: AdminErrorCode.WORD_NOT_FOUND,
              message: error.message,
            },
          },
          { status: 404 }
        );
      }

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

      if (error.name === AdminErrorCode.WORD_ALREADY_DELETED) {
        return NextResponse.json<AdminErrorResponse>(
          {
            success: false,
            error: {
              code: AdminErrorCode.WORD_ALREADY_DELETED,
              message: error.message,
            },
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json<AdminErrorResponse>(
      {
        success: false,
        error: {
          code: AdminErrorCode.DATABASE_ERROR,
          message: "単語の更新に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/words/:id - 単語削除API（ソフトデリート）
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // APIキー認証
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = params;

    // 単語を削除（ソフトデリート）
    const deletedWord = await wordManagementService.deleteWord(id);

    return NextResponse.json<DeleteWordResponse>({
      success: true,
      data: deletedWord,
    });
  } catch (error) {
    console.error("Failed to delete word:", error);

    // エラー種別に応じてレスポンスを変更
    if (error instanceof Error) {
      if (error.name === AdminErrorCode.WORD_NOT_FOUND) {
        return NextResponse.json<AdminErrorResponse>(
          {
            success: false,
            error: {
              code: AdminErrorCode.WORD_NOT_FOUND,
              message: error.message,
            },
          },
          { status: 404 }
        );
      }

      if (error.name === AdminErrorCode.WORD_ALREADY_DELETED) {
        return NextResponse.json<AdminErrorResponse>(
          {
            success: false,
            error: {
              code: AdminErrorCode.WORD_ALREADY_DELETED,
              message: error.message,
            },
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json<AdminErrorResponse>(
      {
        success: false,
        error: {
          code: AdminErrorCode.DATABASE_ERROR,
          message: "単語の削除に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}
