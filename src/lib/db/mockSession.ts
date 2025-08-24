// モックセッション管理

import type { 
  QuestionData, 
  CreateSessionResponse, 
  SubmitAnswerResponse
} from "@/types/database";
import { getRandomMockWords, checkMockAnswer } from "./mockData";

// インメモリセッションストレージ
const sessionStorage = new Map<string, {
  id: string;
  userId: string;
  questions: QuestionData[];
  totalQuestions: number;
  completedQuestions: number;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
  }>;
  isCompleted: boolean;
  createdAt: Date;
}>();

// セッションID生成
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// セッション作成
export function createMockSession(
  userId: string, 
  totalQuestions: number = 10
): CreateSessionResponse {
  const sessionId = generateSessionId();
  const questions = getRandomMockWords(totalQuestions);

  const session = {
    id: sessionId,
    userId,
    questions,
    totalQuestions,
    completedQuestions: 0,
    answers: [],
    isCompleted: false,
    createdAt: new Date(),
  };

  sessionStorage.set(sessionId, session);

  return {
    sessionId,
    totalQuestions,
    questions,
  };
}

// セッション取得
export function getMockSession(sessionId: string) {
  return sessionStorage.get(sessionId) || null;
}

// 回答提出
export function submitMockAnswer(
  sessionId: string,
  questionId: string,
  userAnswer: string
): SubmitAnswerResponse | null {
  const session = sessionStorage.get(sessionId);
  if (!session) return null;

  // 問題を検索
  const question = session.questions.find(q => q.id === questionId);
  if (!question) return null;

  // 重複回答チェック
  const existingAnswer = session.answers.find(a => a.questionId === questionId);
  if (existingAnswer) return null;

  // 回答チェック
  const isCorrect = checkMockAnswer(question, userAnswer);

  // 回答を記録
  session.answers.push({
    questionId,
    userAnswer,
    isCorrect,
  });

  session.completedQuestions = session.answers.length;

  // セッション完了チェック
  if (session.completedQuestions >= session.totalQuestions) {
    session.isCompleted = true;
  }

  return {
    isCorrect,
    correctAnswers: question.answers,
    userAnswer,
    synonyms: question.synonyms,
    completedQuestions: session.completedQuestions,
    totalQuestions: session.totalQuestions,
  };
}

// セッション統計取得
export function getMockSessionStats(sessionId: string) {
  const session = sessionStorage.get(sessionId);
  if (!session) return null;

  const correctAnswers = session.answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = session.answers.filter(a => !a.isCorrect).length;
  const accuracy = session.answers.length > 0 ? correctAnswers / session.answers.length : 0;

  return {
    sessionId: session.id,
    totalQuestions: session.totalQuestions,
    completedQuestions: session.completedQuestions,
    correctAnswers,
    incorrectAnswers,
    accuracy: Math.round(accuracy * 100) / 100,
    isCompleted: session.isCompleted,
  };
}