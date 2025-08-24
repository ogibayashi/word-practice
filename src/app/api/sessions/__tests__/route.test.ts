/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "../route";

// モックセッション管理のインポート
jest.mock("@/lib/db/mockSession", () => ({
  createMockSession: jest.fn(),
}));

import { createMockSession } from "@/lib/db/mockSession";

const mockCreateMockSession = createMockSession as jest.MockedFunction<typeof createMockSession>;

describe("/api/sessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("セッションを正常に作成できる", async () => {
    // モックレスポンスを準備
    const mockSessionResponse = {
      sessionId: "session-123",
      totalQuestions: 10,
      questions: [
        {
          id: "1",
          japaneseMeaning: "走る",
          answers: ["run", "jog"],
          synonyms: ["駆ける"],
        },
        {
          id: "2",
          japaneseMeaning: "美しい",
          answers: ["beautiful", "pretty"],
          synonyms: ["きれい"],
        },
      ],
    };

    mockCreateMockSession.mockReturnValue(mockSessionResponse);

    // リクエストボディを準備
    const requestBody = {
      userId: "user-123",
      totalQuestions: 10,
    };

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // 検証
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.sessionId).toBe("session-123");
    expect(data.data.totalQuestions).toBe(10);
    expect(data.data.questions).toHaveLength(2);
    expect(mockCreateMockSession).toHaveBeenCalledWith("user-123", 10);
  });

  it("userIdが未指定の場合は400エラーを返す", async () => {
    const requestBody = {
      totalQuestions: 10,
    };

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("リクエストボディが不正です");
  });

  it("totalQuestionsが1未満の場合は400エラーを返す", async () => {
    const requestBody = {
      userId: "user-123",
      totalQuestions: 0,
    };

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("リクエストボディが不正です");
  });

  it("totalQuestionsが50を超える場合は400エラーを返す", async () => {
    const requestBody = {
      userId: "user-123",
      totalQuestions: 51,
    };

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("リクエストボディが不正です");
  });

  it("無効なJSONの場合は400エラーを返す", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "無効なJSON",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("リクエストの解析に失敗しました");
  });

  it("セッション作成でエラーが発生した場合は500エラーを返す", async () => {
    mockCreateMockSession.mockImplementation(() => {
      throw new Error("Session creation failed");
    });

    const requestBody = {
      userId: "user-123",
      totalQuestions: 10,
    };

    const request = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("セッションの作成に失敗しました");
  });
});
