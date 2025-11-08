/**
 * @jest-environment node
 */

// モック設定（インポートより前に定義）
jest.mock("@/lib/services/wordManagementService");
jest.mock("@/lib/middleware/apiKeyAuth", () => ({
  validateApiKey: jest.fn(() => null), // デフォルトは認証成功
}));

import { wordManagementService } from "@/lib/services/wordManagementService";
import { AdminErrorCode } from "@/types/admin";
import { NextRequest } from "next/server";
import { DELETE, PUT } from "../route";

const mockWordManagementService = wordManagementService as jest.Mocked<
  typeof wordManagementService
>;

describe("PUT /api/admin/words/:id", () => {
  const validApiKey = "test-api-key";
  const wordId = "word-123";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_API_KEY = validApiKey;
  });

  afterEach(() => {
    process.env.ADMIN_API_KEY = undefined;
  });

  it("正常に単語を更新できる", async () => {
    const mockResponse = {
      id: wordId,
      japanese_meaning: "速く走る",
      answers: [
        { id: "ans-1", answer: "run", is_primary: true },
        { id: "ans-2", answer: "sprint", is_primary: false },
      ],
      synonyms: ["疾走"],
      is_active: true,
      created_at: "2024-01-01T00:00:00.000Z",
    };

    mockWordManagementService.updateWord.mockResolvedValue(mockResponse);

    const requestBody = {
      japanese_meaning: "速く走る",
      answers: ["run", "sprint"],
      synonyms: ["疾走"],
    };

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResponse);
    expect(mockWordManagementService.updateWord).toHaveBeenCalledWith(wordId, requestBody);
  });

  it("部分更新: japanese_meaningのみ更新", async () => {
    const mockResponse = {
      id: wordId,
      japanese_meaning: "速く走る",
      answers: [{ id: "ans-1", answer: "run", is_primary: true }],
      synonyms: [],
      is_active: true,
      created_at: "2024-01-01T00:00:00.000Z",
    };

    mockWordManagementService.updateWord.mockResolvedValue(mockResponse);

    const requestBody = {
      japanese_meaning: "速く走る",
    };

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("バリデーションエラー: フィールドが1つも指定されていない", async () => {
    const requestBody = {};

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.MISSING_FIELDS);
  });

  it("エラー: 単語が見つからない", async () => {
    const error = new Error("指定された単語が見つかりません");
    error.name = AdminErrorCode.WORD_NOT_FOUND;
    mockWordManagementService.updateWord.mockRejectedValue(error);

    const requestBody = {
      japanese_meaning: "走る",
    };

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.WORD_NOT_FOUND);
  });

  it("エラー: 重複する日本語の意味", async () => {
    const error = new Error("この日本語の意味は既に登録されています");
    error.name = AdminErrorCode.DUPLICATE_WORD;
    mockWordManagementService.updateWord.mockRejectedValue(error);

    const requestBody = {
      japanese_meaning: "走る",
    };

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.DUPLICATE_WORD);
  });

  it("エラー: 削除済みの単語を更新しようとした", async () => {
    const error = new Error("削除済みの単語は更新できません");
    error.name = AdminErrorCode.WORD_ALREADY_DELETED;
    mockWordManagementService.updateWord.mockRejectedValue(error);

    const requestBody = {
      japanese_meaning: "走る",
    };

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.WORD_ALREADY_DELETED);
  });
});

describe("DELETE /api/admin/words/:id", () => {
  const validApiKey = "test-api-key";
  const wordId = "word-123";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_API_KEY = validApiKey;
  });

  afterEach(() => {
    process.env.ADMIN_API_KEY = undefined;
  });

  it("正常に単語を削除できる（ソフトデリート）", async () => {
    const mockResponse = {
      id: wordId,
      japanese_meaning: "走る",
      is_active: false as const,
      deleted_at: "2024-01-01T00:00:00.000Z",
    };

    mockWordManagementService.deleteWord.mockResolvedValue(mockResponse);

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
      },
    });

    const response = await DELETE(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResponse);
    expect(mockWordManagementService.deleteWord).toHaveBeenCalledWith(wordId);
  });

  it("エラー: 単語が見つからない", async () => {
    const error = new Error("指定された単語が見つかりません");
    error.name = AdminErrorCode.WORD_NOT_FOUND;
    mockWordManagementService.deleteWord.mockRejectedValue(error);

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
      },
    });

    const response = await DELETE(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.WORD_NOT_FOUND);
  });

  it("エラー: 既に削除済みの単語", async () => {
    const error = new Error("この単語は既に削除されています");
    error.name = AdminErrorCode.WORD_ALREADY_DELETED;
    mockWordManagementService.deleteWord.mockRejectedValue(error);

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
      },
    });

    const response = await DELETE(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.WORD_ALREADY_DELETED);
  });

  it("データベースエラー", async () => {
    mockWordManagementService.deleteWord.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(`http://localhost:3000/api/admin/words/${wordId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
      },
    });

    const response = await DELETE(request, { params: { id: wordId } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.DATABASE_ERROR);
  });
});
