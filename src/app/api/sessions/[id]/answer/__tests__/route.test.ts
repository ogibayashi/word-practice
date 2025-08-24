/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "../route";

// モックセッション管理のインポート
jest.mock("@/lib/db/mockSession", () => ({
  submitMockAnswer: jest.fn(),
}));

import { submitMockAnswer } from "@/lib/db/mockSession";

const mockSubmitMockAnswer = submitMockAnswer as jest.MockedFunction<typeof submitMockAnswer>;

describe("/api/sessions/[id]/answer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("回答を正常に提出できる（正解の場合）", async () => {
    // モックレスポンスを準備
    const mockAnswerResponse = {
      isCorrect: true,
      correctAnswers: ["run", "jog"],
      userAnswer: "run",
      synonyms: ["駆ける"],
      completedQuestions: 1,
      totalQuestions: 10,
    };

    mockSubmitMockAnswer.mockReturnValue(mockAnswerResponse);

    // リクエストボディを準備
    const requestBody = {
      wordId: "question-123",
      userAnswer: "run",
    };

    const request = new NextRequest("http://localhost:3000/api/sessions/session-123/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // パラメータをモック
    const params = { params: Promise.resolve({ id: "session-123" }) };

    const response = await POST(request, params);
    const data = await response.json();

    // 検証
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isCorrect).toBe(true);
    expect(data.data.correctAnswers).toEqual(["run", "jog"]);
    expect(data.data.userAnswer).toBe("run");
    expect(data.data.completedQuestions).toBe(1);
    expect(data.data.totalQuestions).toBe(10);
    expect(mockSubmitMockAnswer).toHaveBeenCalledWith("session-123", "question-123", "run");
  });

  it("回答を正常に提出できる（不正解の場合）", async () => {
    const mockAnswerResponse = {
      isCorrect: false,
      correctAnswers: ["run", "jog"],
      userAnswer: "walk",
      synonyms: ["駆ける"],
      completedQuestions: 1,
      totalQuestions: 10,
    };

    mockSubmitMockAnswer.mockReturnValue(mockAnswerResponse);

    const requestBody = {
      wordId: "question-123",
      userAnswer: "walk",
    };

    const request = new NextRequest("http://localhost:3000/api/sessions/session-123/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const params = { params: Promise.resolve({ id: "session-123" }) };

    const response = await POST(request, params);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isCorrect).toBe(false);
    expect(data.data.userAnswer).toBe("walk");
  });

  it("存在しないセッションIDの場合は404エラーを返す", async () => {
    mockSubmitMockAnswer.mockReturnValue(null);

    const requestBody = {
      wordId: "question-123",
      userAnswer: "run",
    };

    const request = new NextRequest("http://localhost:3000/api/sessions/invalid-session/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const params = { params: Promise.resolve({ id: "invalid-session" }) };

    const response = await POST(request, params);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("セッションまたは問題が見つかりません");
  });

  it("wordIdが未指定の場合は400エラーを返す", async () => {
    const requestBody = {
      userAnswer: "run",
    };

    const request = new NextRequest("http://localhost:3000/api/sessions/session-123/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const params = { params: Promise.resolve({ id: "session-123" }) };

    const response = await POST(request, params);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("リクエストボディが不正です");
  });

  it("userAnswerが未指定の場合は400エラーを返す", async () => {
    const requestBody = {
      wordId: "question-123",
    };

    const request = new NextRequest("http://localhost:3000/api/sessions/session-123/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const params = { params: Promise.resolve({ id: "session-123" }) };

    const response = await POST(request, params);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("リクエストボディが不正です");
  });

  it("無効なJSONの場合は400エラーを返す", async () => {
    const request = new NextRequest("http://localhost:3000/api/sessions/session-123/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "無効なJSON",
    });

    const params = { params: Promise.resolve({ id: "session-123" }) };

    const response = await POST(request, params);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("リクエストの解析に失敗しました");
  });

  it("システムエラーの場合は500エラーを返す", async () => {
    mockSubmitMockAnswer.mockImplementation(() => {
      throw new Error("System error");
    });

    const requestBody = {
      wordId: "question-123",
      userAnswer: "run",
    };

    const request = new NextRequest("http://localhost:3000/api/sessions/session-123/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const params = { params: Promise.resolve({ id: "session-123" }) };

    const response = await POST(request, params);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("回答の提出に失敗しました");
  });
});
