import { prisma as db } from "@/lib/db/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// パラメータの型定義
interface RouteParams {
  userId: string;
}

const UserIdSchema = z.string().min(1, "ユーザーIDが必要です");

/**
 * GET /api/users/[userId]/stats
 * ユーザーの学習統計情報を取得する
 */
export async function GET(request: NextRequest, context: { params: Promise<RouteParams> }) {
  try {
    const params = await context.params;
    const userId = UserIdSchema.parse(params.userId);

    // ユーザーの存在確認
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 学習履歴の統計情報を並列で取得
    const [
      totalAnswers,
      correctAnswers,
      totalSessions,
      completedSessions,
      recentActivity,
      wordProgress,
    ] = await Promise.all([
      // 総回答数
      db.learningHistory.count({
        where: { userId },
      }),

      // 正解数
      db.learningHistory.count({
        where: { userId, isCorrect: true },
      }),

      // 総セッション数
      db.session.count({
        where: { userId },
      }),

      // 完了セッション数
      db.session.count({
        where: { userId, isCompleted: true },
      }),

      // 最近の学習活動（過去30日）
      db.learningHistory.groupBy({
        by: ["answeredAt"],
        where: {
          userId,
          answeredAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日前
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          answeredAt: "desc",
        },
      }),

      // 単語別の学習進捗
      db.learningHistory.groupBy({
        by: ["wordId", "isCorrect"],
        where: { userId },
        _count: {
          id: true,
        },
      }),
    ]);

    // 正解率を計算
    const accuracyRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    // セッション完了率を計算
    const sessionCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // 単語別の学習進捗を処理
    const wordStats = new Map<string, { correct: number; incorrect: number; total: number }>();

    wordProgress.forEach((item: any) => {
      const wordId = item.wordId;
      if (!wordStats.has(wordId)) {
        wordStats.set(wordId, { correct: 0, incorrect: 0, total: 0 });
      }
      const stats = wordStats.get(wordId)!;

      if (item.isCorrect) {
        stats.correct += item._count.id;
      } else {
        stats.incorrect += item._count.id;
      }
      stats.total += item._count.id;
    });

    // 学習した単語数
    const studiedWordCount = wordStats.size;

    // 習得済み単語数（正解率80%以上の単語）
    const masteredWordCount = Array.from(wordStats.values()).filter(
      (stats) => stats.total >= 3 && stats.correct / stats.total >= 0.8
    ).length;

    // 最後の学習日を取得
    const lastStudyDate = await db.learningHistory.findFirst({
      where: { userId },
      select: { answeredAt: true },
      orderBy: { answeredAt: "desc" },
    });

    // 今日の学習活動
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayActivity = await db.learningHistory.count({
      where: {
        userId,
        answeredAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 連続学習日数を計算（簡易版）
    const studyStreak = await calculateStudyStreak(userId);

    const statsData = {
      user: {
        id: user.id,
        displayName: user.displayName,
        memberSince: user.createdAt,
      },
      overview: {
        totalAnswers,
        correctAnswers,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
        studiedWordCount,
        masteredWordCount,
        totalSessions,
        completedSessions,
        sessionCompletionRate: Math.round(sessionCompletionRate * 100) / 100,
      },
      activity: {
        lastStudyDate: lastStudyDate?.answeredAt || null,
        todayAnswers: todayActivity,
        studyStreak,
      },
      recentActivity: recentActivity.slice(0, 7), // 最近7日分
      wordProgress: Array.from(wordStats.entries())
        .map(([wordId, stats]) => ({
          wordId,
          correctCount: stats.correct,
          incorrectCount: stats.incorrect,
          totalAttempts: stats.total,
          accuracyRate: Math.round((stats.correct / stats.total) * 10000) / 100,
        }))
        .sort((a, b) => b.totalAttempts - a.totalAttempts), // 回答数の多い順
    };

    return NextResponse.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    console.error("学習統計取得エラー:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "パラメータのバリデーションエラー",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "学習統計の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * 連続学習日数を計算する簡易版
 * 実装を簡単にするため、最大30日まで遡って計算
 */
async function calculateStudyStreak(userId: string): Promise<number> {
  try {
    // 過去30日間の学習日を取得
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const studyDays = await db.learningHistory.findMany({
      where: {
        userId,
        answeredAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        answeredAt: true,
      },
      orderBy: {
        answeredAt: "desc",
      },
    });

    if (studyDays.length === 0) return 0;

    // 日付のみを抽出してユニークにする
    const uniqueDays = Array.from(
      new Set(
        studyDays.map((item: any) => {
          const date = new Date(item.answeredAt);
          return date.toDateString();
        })
      )
    ).sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

    // 今日から遡って連続日数をカウント
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // 今日または昨日から開始
    const currentDate = uniqueDays.includes(today)
      ? today
      : uniqueDays.includes(yesterday)
        ? yesterday
        : null;

    if (!currentDate) return 0;

    for (let i = 0; i < uniqueDays.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - (currentDate === today ? i : i + 1));

      if (uniqueDays[i] === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error("連続学習日数計算エラー:", error);
    return 0;
  }
}
