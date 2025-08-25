"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, RotateCcw, Trophy } from "lucide-react";

interface SessionCompleteProps {
  totalQuestions: number;
  correctCount?: number;
  onRestart: () => void;
  onHome: () => void;
}

export function SessionComplete({
  totalQuestions,
  correctCount = 0,
  onRestart,
  onHome,
}: SessionCompleteProps) {
  // Defensive error handling
  const safeTotal = Math.max(totalQuestions, 0);
  const safeCorrect = Math.max(Math.min(correctCount, safeTotal), 0);
  const accuracy = safeTotal > 0 ? Math.round((safeCorrect / safeTotal) * 100) : 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-labelledby="session-complete-title"
      aria-describedby="session-complete-description"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle
            id="session-complete-title"
            className="text-center flex items-center justify-center gap-2"
          >
            <Trophy className="text-yellow-500" size={32} />
            <span className="text-gray-800">学習完了！</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p id="session-complete-description" className="text-lg text-gray-600 mb-4">
              お疲れさまでした！
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">総問題数</p>
              <p className="text-2xl font-bold text-blue-600">{safeTotal}</p>
            </div>

            {safeCorrect > 0 && (
              <>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">正解数</p>
                  <p className="text-2xl font-bold text-green-600">{safeCorrect}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">正解率</p>
                  <p className="text-2xl font-bold text-purple-600">{accuracy}%</p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3 pt-4">
            <Button onClick={onRestart} className="w-full" size="lg">
              <RotateCcw className="mr-2" size={16} />
              もう一度学習する
            </Button>

            <Button onClick={onHome} variant="outline" className="w-full" size="lg">
              <Home className="mr-2" size={16} />
              ホームに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
