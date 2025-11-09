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
import { POST } from "../route";

const mockWordManagementService = wordManagementService as jest.Mocked<
  typeof wordManagementService
>;

describe("POST /api/admin/words/batch", () => {
  const validApiKey = "test-api-key";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_API_KEY = validApiKey;
  });

  afterEach(() => {
    process.env.ADMIN_API_KEY = undefined;
  });

  it("正常に複数の単語を一括作成できる", async () => {
    const mockResponse = {
      created: 2,
      failed: 0,
      errors: [],
    };

    mockWordManagementService.batchCreateWords.mockResolvedValue(mockResponse);

    const requestBody = {
      words: [
        {
          japanese_meaning: "走る",
          answers: ["run", "jog"],
          synonyms: ["駆ける"],
        },
        {
          japanese_meaning: "美しい",
          answers: ["beautiful", "pretty"],
          synonyms: ["きれい"],
        },
      ],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResponse);
    expect(mockWordManagementService.batchCreateWords).toHaveBeenCalledWith(requestBody.words);
  });

  it("部分的な失敗の場合は207 Multi-Statusを返す", async () => {
    const mockResponse = {
      created: 1,
      failed: 1,
      errors: [
        {
          index: 1,
          japanese_meaning: "美しい",
          error: "この日本語の意味は既に登録されています",
        },
      ],
    };

    mockWordManagementService.batchCreateWords.mockResolvedValue(mockResponse);

    const requestBody = {
      words: [
        {
          japanese_meaning: "走る",
          answers: ["run"],
        },
        {
          japanese_meaning: "美しい",
          answers: ["beautiful"],
        },
      ],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(207);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResponse);
  });

  it("全件失敗の場合は400を返す", async () => {
    const mockResponse = {
      created: 0,
      failed: 2,
      errors: [
        {
          index: 0,
          japanese_meaning: "走る",
          error: "この日本語の意味は既に登録されています",
        },
        {
          index: 1,
          japanese_meaning: "美しい",
          error: "この日本語の意味は既に登録されています",
        },
      ],
    };

    mockWordManagementService.batchCreateWords.mockResolvedValue(mockResponse);

    const requestBody = {
      words: [
        {
          japanese_meaning: "走る",
          answers: ["run"],
        },
        {
          japanese_meaning: "美しい",
          answers: ["beautiful"],
        },
      ],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResponse);
  });

  it("バリデーションエラー: wordsが空配列", async () => {
    const requestBody = {
      words: [],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.VALIDATION_ERROR);
  });

  it("バリデーションエラー: wordsが101個以上", async () => {
    const words = Array.from({ length: 101 }, (_, i) => ({
      japanese_meaning: `単語${i}`,
      answers: ["answer"],
    }));

    const requestBody = { words };

    const request = new NextRequest("http://localhost:3000/api/admin/words/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.VALIDATION_ERROR);
  });

  it("バリデーションエラー: 個別の単語のバリデーション失敗", async () => {
    const requestBody = {
      words: [
        {
          japanese_meaning: "",
          answers: ["run"],
        },
      ],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.VALIDATION_ERROR);
  });

  it("データベースエラーの場合は500を返す", async () => {
    mockWordManagementService.batchCreateWords.mockRejectedValue(
      new Error("Database connection failed")
    );

    const requestBody = {
      words: [
        {
          japanese_meaning: "走る",
          answers: ["run"],
        },
      ],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.DATABASE_ERROR);
  });
});
