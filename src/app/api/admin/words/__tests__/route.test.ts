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
import { GET, POST } from "../route";

const mockWordManagementService = wordManagementService as jest.Mocked<
  typeof wordManagementService
>;

describe("POST /api/admin/words", () => {
  const validApiKey = "test-api-key";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_API_KEY = validApiKey;
  });

  afterEach(() => {
    process.env.ADMIN_API_KEY = undefined;
  });

  it("正常に単語を作成できる", async () => {
    const mockResponse = {
      id: "word-123",
      japanese_meaning: "走る",
      answers: [
        { id: "ans-1", answer: "run", is_primary: true },
        { id: "ans-2", answer: "jog", is_primary: false },
      ],
      synonyms: ["駆ける"],
      is_active: true,
      created_at: "2024-01-01T00:00:00.000Z",
    };

    mockWordManagementService.createWord.mockResolvedValue(mockResponse);

    const requestBody = {
      japanese_meaning: "走る",
      answers: ["run", "jog"],
      synonyms: ["駆ける"],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words", {
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
  });

  it("バリデーションエラー: japanese_meaningが空", async () => {
    const requestBody = {
      japanese_meaning: "",
      answers: ["run"],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words", {
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

  it("バリデーションエラー: answersが空配列", async () => {
    const requestBody = {
      japanese_meaning: "走る",
      answers: [],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words", {
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

  it("バリデーションエラー: answersが10個を超える", async () => {
    const requestBody = {
      japanese_meaning: "走る",
      answers: Array(11).fill("run"),
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words", {
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

  it("重複エラー: 同じ日本語の意味が既に存在", async () => {
    const error = new Error("この日本語の意味は既に登録されています");
    error.name = AdminErrorCode.DUPLICATE_WORD;
    mockWordManagementService.createWord.mockRejectedValue(error);

    const requestBody = {
      japanese_meaning: "走る",
      answers: ["run"],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.DUPLICATE_WORD);
  });

  it("データベースエラー", async () => {
    mockWordManagementService.createWord.mockRejectedValue(new Error("Database error"));

    const requestBody = {
      japanese_meaning: "走る",
      answers: ["run"],
    };

    const request = new NextRequest("http://localhost:3000/api/admin/words", {
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

describe("GET /api/admin/words", () => {
  const validApiKey = "test-api-key";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_API_KEY = validApiKey;
  });

  afterEach(() => {
    process.env.ADMIN_API_KEY = undefined;
  });

  it("正常に単語リストを取得できる", async () => {
    const mockResponse = {
      words: [
        {
          id: "word-1",
          japanese_meaning: "走る",
          answers: ["run", "jog"],
          synonyms: ["駆ける"],
          is_active: true,
          created_at: "2024-01-01T00:00:00.000Z",
        },
      ],
      pagination: {
        total: 1,
        limit: 20,
        offset: 0,
        has_next: false,
        total_pages: 1,
      },
    };

    mockWordManagementService.searchWords.mockResolvedValue(mockResponse);

    const request = new NextRequest("http://localhost:3000/api/admin/words", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResponse);
  });

  it("検索クエリを指定して単語を検索できる", async () => {
    const mockResponse = {
      words: [
        {
          id: "word-1",
          japanese_meaning: "走る",
          answers: ["run"],
          synonyms: [],
          is_active: true,
          created_at: "2024-01-01T00:00:00.000Z",
        },
      ],
      pagination: {
        total: 1,
        limit: 10,
        offset: 0,
        has_next: false,
        total_pages: 1,
      },
    };

    mockWordManagementService.searchWords.mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/words?search=走&limit=10&offset=0",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${validApiKey}`,
        },
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockWordManagementService.searchWords).toHaveBeenCalledWith({
      search: "走",
      is_active: "true",
      limit: 10,
      offset: 0,
    });
  });

  it("バリデーションエラー: limitが範囲外", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/words?limit=101", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.VALIDATION_ERROR);
  });

  it("バリデーションエラー: offsetが負の数", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/words?offset=-1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.VALIDATION_ERROR);
  });

  it("バリデーションエラー: is_activeが不正な値", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/words?is_active=invalid", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${validApiKey}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(AdminErrorCode.VALIDATION_ERROR);
  });
});
