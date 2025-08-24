/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "../route";

// モックデータのインポート
jest.mock("@/lib/db/fallback", () => ({
  getWordsWithFallback: jest.fn(),
}));

import { getWordsWithFallback } from "@/lib/db/fallback";

const mockGetWordsWithFallback = getWordsWithFallback as jest.MockedFunction<
  typeof getWordsWithFallback
>;

describe("/api/words/random", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("デフォルトで10問の単語を取得できる", async () => {
    // モックデータを準備
    const mockWords = [
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
    ];

    mockGetWordsWithFallback.mockResolvedValue(mockWords);

    // リクエストを作成
    const request = new NextRequest("http://localhost:3000/api/words/random");

    // APIを呼び出し
    const response = await GET(request);
    const data = await response.json();

    // 検証
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toHaveProperty("id");
    expect(data.data[0]).toHaveProperty("japaneseMeaning");
    expect(data.data[0]).toHaveProperty("answers");
    expect(data.data[0]).toHaveProperty("synonyms");
    expect(mockGetWordsWithFallback).toHaveBeenCalledWith(10);
  });

  it("countパラメータで問題数を指定できる", async () => {
    const mockWords = [
      {
        id: "1",
        japaneseMeaning: "走る",
        answers: ["run"],
        synonyms: ["駆ける"],
      },
    ];

    mockGetWordsWithFallback.mockResolvedValue(mockWords);

    // countパラメータ付きのリクエストを作成
    const request = new NextRequest("http://localhost:3000/api/words/random?count=5");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetWordsWithFallback).toHaveBeenCalledWith(5);
  });

  it("count=0の場合は400エラーを返す", async () => {
    const request = new NextRequest("http://localhost:3000/api/words/random?count=0");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("問題数は1〜50の範囲で指定してください");
  });

  it("count=51の場合は400エラーを返す", async () => {
    const request = new NextRequest("http://localhost:3000/api/words/random?count=51");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("問題数は1〜50の範囲で指定してください");
  });

  it("単語データが0件の場合は404エラーを返す", async () => {
    mockGetWordsWithFallback.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/words/random");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("利用可能な単語データがありません");
  });

  it("データベースエラーの場合は500エラーを返す", async () => {
    mockGetWordsWithFallback.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/words/random");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("単語の取得に失敗しました");
  });
});
