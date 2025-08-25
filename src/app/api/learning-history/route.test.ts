import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// Prisma Clientのモック
jest.mock("@/lib/db/client", () => ({
  prisma: {
    learningHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma as db } from "@/lib/db/client";
const mockDb = jest.mocked(db);

describe("/api/learning-history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("正常な学習履歴保存リクエストを処理できる", async () => {
      const mockLearningHistory = {
        id: "history-1",
        userId: "user-1",
        wordId: "word-1",
        sessionId: "session-1",
        isCorrect: true,
        userAnswer: "test",
        answeredAt: new Date(),
        user: {
          id: "user-1",
          displayName: "Test User",
        },
        word: {
          id: "word-1",
          japaneseMeaning: "テスト",
          answers: [{ answer: "test", isPrimary: true }],
        },
        session: {
          id: "session-1",
          totalQuestions: 10,
          completedQuestions: 1,
        },
      };

      mockDb.learningHistory.create.mockResolvedValue(mockLearningHistory);

      const request = new NextRequest("http://localhost:3000/api/learning-history", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-1",
          wordId: "word-1",
          sessionId: "session-1",
          isCorrect: true,
          userAnswer: "test",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockLearningHistory);
      expect(mockDb.learningHistory.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          wordId: "word-1",
          sessionId: "session-1",
          isCorrect: true,
          userAnswer: "test",
        },
        include: {
          user: {
            select: { id: true, displayName: true },
          },
          word: {
            select: { id: true, japaneseMeaning: true },
            include: {
              answers: true,
            },
          },
          session: {
            select: { id: true, totalQuestions: true, completedQuestions: true },
          },
        },
      });
    });

    it("無効なリクエストボディでバリデーションエラーを返す", async () => {
      const request = new NextRequest("http://localhost:3000/api/learning-history", {
        method: "POST",
        body: JSON.stringify({
          userId: "", // 空文字列
          wordId: "word-1",
          sessionId: "session-1",
          isCorrect: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("バリデーションエラー");
      expect(data.details).toBeDefined();
      expect(mockDb.learningHistory.create).not.toHaveBeenCalled();
    });

    it("データベースエラーで500エラーを返す", async () => {
      mockDb.learningHistory.create.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/learning-history", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-1",
          wordId: "word-1",
          sessionId: "session-1",
          isCorrect: true,
          userAnswer: "test",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("学習履歴の保存に失敗しました");
    });
  });

  describe("GET", () => {
    it("正常な学習履歴取得リクエストを処理できる", async () => {
      const mockHistoryData = [
        {
          id: "history-1",
          userId: "user-1",
          wordId: "word-1",
          sessionId: "session-1",
          isCorrect: true,
          userAnswer: "test",
          answeredAt: new Date(),
          word: {
            id: "word-1",
            japaneseMeaning: "テスト",
            answers: [{ answer: "test", isPrimary: true }],
          },
          session: {
            id: "session-1",
            startedAt: new Date(),
            isCompleted: true,
          },
        },
      ];

      mockDb.learningHistory.findMany.mockResolvedValue(mockHistoryData);
      mockDb.learningHistory.count.mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3000/api/learning-history?userId=user-1&limit=10&offset=0"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.history).toEqual(mockHistoryData);
      expect(data.data.totalCount).toBe(1);
      expect(data.data.limit).toBe(10);
      expect(data.data.offset).toBe(0);
      expect(data.data.hasMore).toBe(false);

      expect(mockDb.learningHistory.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: {
          word: {
            select: { id: true, japaneseMeaning: true },
            include: {
              answers: {
                select: { answer: true, isPrimary: true },
              },
            },
          },
          session: {
            select: { id: true, startedAt: true, isCompleted: true },
          },
        },
        orderBy: { answeredAt: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("デフォルトのlimitとoffsetが正しく適用される", async () => {
      mockDb.learningHistory.findMany.mockResolvedValue([]);
      mockDb.learningHistory.count.mockResolvedValue(0);

      const request = new NextRequest("http://localhost:3000/api/learning-history?userId=user-1");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.limit).toBe(50); // デフォルト値
      expect(data.data.offset).toBe(0); // デフォルト値

      expect(mockDb.learningHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      );
    });

    it("userIdが不正な場合バリデーションエラーを返す", async () => {
      const request = new NextRequest("http://localhost:3000/api/learning-history?userId=");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("クエリパラメータのバリデーションエラー");
      expect(mockDb.learningHistory.findMany).not.toHaveBeenCalled();
    });

    it("hasMoreフラグが正しく計算される", async () => {
      mockDb.learningHistory.findMany.mockResolvedValue([]);
      mockDb.learningHistory.count.mockResolvedValue(100);

      const request = new NextRequest(
        "http://localhost:3000/api/learning-history?userId=user-1&limit=20&offset=30"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.hasMore).toBe(true); // 30 + 20 = 50 < 100
    });
  });
});
