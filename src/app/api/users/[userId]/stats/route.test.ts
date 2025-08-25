import { NextRequest } from "next/server";
import { GET } from "./route";

// Prisma Clientのモック
jest.mock("@/lib/db/client", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    learningHistory: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    session: {
      count: jest.fn(),
    },
  },
}));

import { prisma as db } from "@/lib/db/client";
const mockDb = jest.mocked(db);

describe("/api/users/[userId]/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ユーザーの学習統計情報を正しく取得できる", async () => {
    const mockUser = {
      id: "user-1",
      displayName: "Test User",
      createdAt: new Date("2024-01-01"),
    };

    const mockLastStudyDate = {
      answeredAt: new Date("2024-08-20"),
    };

    // モックデータの設定
    mockDb.user.findUnique.mockResolvedValue(mockUser);

    // Promise.allで並列実行される統計クエリのモック
    mockDb.learningHistory.count
      .mockResolvedValueOnce(50) // totalAnswers
      .mockResolvedValueOnce(35) // correctAnswers
      .mockResolvedValueOnce(5); // todayActivity

    mockDb.session.count
      .mockResolvedValueOnce(8) // totalSessions
      .mockResolvedValueOnce(6); // completedSessions

    mockDb.learningHistory.groupBy
      .mockResolvedValueOnce([
        // recentActivity
        { answeredAt: new Date("2024-08-20"), _count: { id: 10 } },
      ])
      .mockResolvedValueOnce([
        // wordProgress
        { wordId: "word-1", isCorrect: true, _count: { id: 8 } },
        { wordId: "word-1", isCorrect: false, _count: { id: 2 } },
        { wordId: "word-2", isCorrect: true, _count: { id: 5 } },
        { wordId: "word-2", isCorrect: false, _count: { id: 1 } },
      ]);

    mockDb.learningHistory.findFirst.mockResolvedValue(mockLastStudyDate);

    const request = new NextRequest("http://localhost:3000/api/users/user-1/stats");

    const response = await GET(request, { params: Promise.resolve({ userId: "user-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // ユーザー情報の確認
    expect(data.data.user).toEqual({
      id: "user-1",
      displayName: "Test User",
      memberSince: mockUser.createdAt,
    });

    // 概要統計の確認
    expect(data.data.overview).toEqual({
      totalAnswers: 50,
      correctAnswers: 35,
      accuracyRate: 70, // (35/50) * 100
      studiedWordCount: 2, // 2つの単語
      masteredWordCount: 1, // word-1のみ（8/(8+2) = 80%以上）
      totalSessions: 8,
      completedSessions: 6,
      sessionCompletionRate: 75, // (6/8) * 100
    });

    // 活動データの確認
    expect(data.data.activity).toEqual({
      lastStudyDate: mockLastStudyDate.answeredAt,
      todayAnswers: 5,
      studyStreak: 0, // 簡易版の実装では0になることを想定
    });

    // 単語進捗の確認（回答数の多い順）
    expect(data.data.wordProgress).toEqual([
      {
        wordId: "word-1",
        correctCount: 8,
        incorrectCount: 2,
        totalAttempts: 10,
        accuracyRate: 80,
      },
      {
        wordId: "word-2",
        correctCount: 5,
        incorrectCount: 1,
        totalAttempts: 6,
        accuracyRate: 83.33,
      },
    ]);
  });

  it("存在しないユーザーで404エラーを返す", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/users/nonexistent/stats");

    const response = await GET(request, { params: Promise.resolve({ userId: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("ユーザーが見つかりません");
  });

  it("無効なuserIdでバリデーションエラーを返す", async () => {
    const request = new NextRequest("http://localhost:3000/api/users//stats");

    const response = await GET(request, { params: Promise.resolve({ userId: "" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("パラメータのバリデーションエラー");
    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
  });

  it("データベースエラーで500エラーを返す", async () => {
    mockDb.user.findUnique.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/users/user-1/stats");

    const response = await GET(request, { params: Promise.resolve({ userId: "user-1" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("学習統計の取得に失敗しました");
  });

  it("学習履歴がない場合でも正常に処理される", async () => {
    const mockUser = {
      id: "user-1",
      displayName: "New User",
      createdAt: new Date("2024-08-25"),
    };

    mockDb.user.findUnique.mockResolvedValue(mockUser);

    // 全ての統計が0の場合
    mockDb.learningHistory.count
      .mockResolvedValueOnce(0) // totalAnswers
      .mockResolvedValueOnce(0) // correctAnswers
      .mockResolvedValueOnce(0); // todayActivity

    mockDb.session.count
      .mockResolvedValueOnce(0) // totalSessions
      .mockResolvedValueOnce(0); // completedSessions

    mockDb.learningHistory.groupBy
      .mockResolvedValueOnce([]) // recentActivity
      .mockResolvedValueOnce([]); // wordProgress

    mockDb.learningHistory.findFirst.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/users/user-1/stats");

    const response = await GET(request, { params: Promise.resolve({ userId: "user-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // 0による除算エラーなどが発生しないことを確認
    expect(data.data.overview.accuracyRate).toBe(0);
    expect(data.data.overview.sessionCompletionRate).toBe(0);
    expect(data.data.overview.studiedWordCount).toBe(0);
    expect(data.data.overview.masteredWordCount).toBe(0);
    expect(data.data.activity.lastStudyDate).toBe(null);
    expect(data.data.wordProgress).toEqual([]);
  });
});
