"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface AnswerResultProps {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswers: string[];
  japaneseMeaning: string;
  onNext: () => void;
  isLastQuestion?: boolean;
}

export function AnswerResult({
  isCorrect,
  userAnswer,
  correctAnswers,
  japaneseMeaning,
  onNext,
  isLastQuestion = false,
}: AnswerResultProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {isCorrect ? (
              <>
                <CheckCircle className="text-green-500" size={32} />
                <span className="text-green-600">正解！</span>
              </>
            ) : (
              <>
                <XCircle className="text-red-500" size={32} />
                <span className="text-red-600">不正解</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700 mb-2">{japaneseMeaning}</p>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">あなたの回答</p>
              <p className={`font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                {userAnswer}
              </p>
            </div>

            {!isCorrect && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">正解</p>
                <p className="font-medium text-green-600">{correctAnswers.join(", ")}</p>
              </div>
            )}

            {isCorrect && correctAnswers.length > 1 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">他の正解</p>
                <p className="font-medium text-blue-600">
                  {correctAnswers
                    .filter((answer) => answer.toLowerCase() !== userAnswer.toLowerCase())
                    .join(", ")}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button onClick={onNext} className="w-full" size="lg">
              {isLastQuestion ? "結果を見る" : "次の問題"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
