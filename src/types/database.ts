import type { User, Word, WordAnswer, Session, LearningHistory } from "@prisma/client";

// 基本的な型定義をエクスポート
export type {
	User,
	Word,
	WordAnswer, 
	Session,
	LearningHistory
};

// 拡張型定義
export type WordWithAnswers = Word & {
	answers: WordAnswer[];
};

export type SessionWithHistory = Session & {
	learningHistory: LearningHistory[];
};

export type UserWithSessions = User & {
	sessions: Session[];
};

// API レスポンス用の型定義
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// 学習セッション関連の型
export interface QuestionData {
	id: string;
	japaneseMeaning: string;
	synonyms: string[];
	answers: string[];
}

export interface SessionStats {
	totalQuestions: number;
	correctAnswers: number;
	incorrectAnswers: number;
	completedQuestions: number;
	accuracy: number;
}

// セッション作成リクエスト
export interface CreateSessionRequest {
	userId: string;
	totalQuestions?: number;
}

// セッション作成レスポンス  
export interface CreateSessionResponse {
	sessionId: string;
	totalQuestions: number;
	questions: QuestionData[];
}

// セッション回答リクエスト
export interface SubmitAnswerRequest {
	questionId: string;
	userAnswer: string;
}

// セッション回答レスポンス
export interface SubmitAnswerResponse {
	isCorrect: boolean;
	correctAnswers: string[];
	userAnswer: string;
	synonyms: string[];
	completedQuestions: number;
	totalQuestions: number;
}

// 学習履歴集計用の型
export interface WordStats {
	wordId: string;
	japaneseMeaning: string;
	totalAttempts: number;
	correctAttempts: number;
	incorrectAttempts: number;
	accuracy: number;
	lastAttemptAt: Date | null;
}

export interface UserLearningProgress {
	totalWordsLearned: number;
	totalSessions: number;
	overallAccuracy: number;
	recentSessions: SessionStats[];
}