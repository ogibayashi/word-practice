"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getUserFromStorage } from "@/lib/auth/localStorage";
import type { CreateSessionResponse } from "@/types/database";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 学習ページで使用する型定義
interface Word {
  id: string;
  japanese: string;
  partOfSpeech: string | null;
  example: string | null;
}

interface Question {
  id: string;
  japaneseMeaning: string;
  answers: string[];
  synonyms: string[];
}

interface Session {
  id: string;
  questions: Question[];
  currentQuestionIndex: number;
}

export default function LearnPage() {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getUserFromStorage();
    if (!user) {
      router.push("/login");
      return;
    }

    initializeSession();
  }, [router]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);

      // セッション作成
      const sessionResponse = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: getUserFromStorage()?.id,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error("セッション作成に失敗しました");
      }

      const sessionResult = await sessionResponse.json();

      if (!sessionResult.success || !sessionResult.data) {
        throw new Error(sessionResult.error || "セッションデータの取得に失敗しました");
      }

      const sessionData = sessionResult.data;
      setSession({
        id: sessionData.sessionId,
        questions: sessionData.questions,
        currentQuestionIndex: 0,
      });

      // セッションの最初の問題を表示
      showCurrentQuestion(sessionData.questions, 0);
    } catch (error) {
      console.error("セッション初期化エラー:", error);
      alert("学習セッションの開始に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const showCurrentQuestion = (questions: Question[], index: number) => {
    if (index >= questions.length) {
      alert("全ての問題が完了しました！");
      return;
    }

    const question = questions[index];
    if (!question) {
      console.error("Question not found at index:", index);
      return;
    }

    const word = {
      id: question.id,
      japanese: question.japaneseMeaning,
      partOfSpeech: null,
      example: null,
    };

    setCurrentWord(word);
    setAnswer("");
  };

  const moveToNextQuestion = () => {
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex >= session.questions.length) {
      alert("全ての問題が完了しました！");
      return;
    }

    const updatedSession = {
      ...session,
      currentQuestionIndex: nextIndex,
    };
    setSession(updatedSession);
    showCurrentQuestion(session.questions, nextIndex);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord || !session || !answer.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // 回答をセッションに記録
      const response = await fetch(`/api/sessions/${session.id}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wordId: currentWord.id,
          userAnswer: answer.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("回答の送信に失敗しました");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "回答処理に失敗しました");
      }

      const answerData = result.data;

      // 結果を表示（今後結果画面に移行）
      if (answerData.isCorrect) {
        alert(`正解！ 答え: ${answerData.correctAnswers.join(", ")}`);
      } else {
        alert(`不正解。正解: ${answerData.correctAnswers.join(", ")}`);
      }

      // 次の問題へ
      moveToNextQuestion();
    } catch (error) {
      console.error("回答送信エラー:", error);
      alert("回答の送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!currentWord || isSubmitting) return;
    moveToNextQuestion();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">学習セッションを準備中...</p>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">単語の取得に失敗しました</p>
          </CardContent>
          <CardFooter>
            <Button onClick={initializeSession} className="w-full">
              再試行
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">英単語学習</h1>
        <p className="text-gray-600 text-center">日本語の意味を見て、英単語を入力してください</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-2xl">問題</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600 mb-4">{currentWord.japanese}</p>
            {currentWord.partOfSpeech && (
              <p className="text-sm text-gray-500 mb-4">({currentWord.partOfSpeech})</p>
            )}
            {currentWord.example && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">例: </span>
                  {currentWord.example}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>あなたの回答</CardTitle>
          <CardDescription>
            英単語を入力してください（大文字・小文字は区別しません）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="英単語を入力..."
              className="text-lg text-center"
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={!answer.trim() || isSubmitting}>
                {isSubmitting ? "送信中..." : "回答"}
              </Button>
              <Button type="button" variant="outline" onClick={handleSkip} disabled={isSubmitting}>
                スキップ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={() => router.push("/")}>
          ホームに戻る
        </Button>
      </div>
    </div>
  );
}
