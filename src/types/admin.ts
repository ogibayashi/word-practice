// 管理API用の型定義

// エラーレスポンス
export interface AdminErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// 単語追加リクエスト
export interface CreateWordRequest {
  japanese_meaning: string;
  answers: string[];
  synonyms?: string[];
}

// 単語更新リクエスト
export interface UpdateWordRequest {
  japanese_meaning?: string;
  answers?: string[];
  synonyms?: string[];
}

// 正解候補レスポンス
export interface WordAnswerResponse {
  id: string;
  answer: string;
  is_primary: boolean;
}

// 単語レスポンス（詳細）
export interface WordDetailResponse {
  id: string;
  japanese_meaning: string;
  answers: WordAnswerResponse[];
  synonyms: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

// 単語追加レスポンス
export interface CreateWordResponse {
  success: true;
  data: WordDetailResponse;
}

// 単語更新レスポンス
export interface UpdateWordResponse {
  success: true;
  data: WordDetailResponse;
}

// 単語削除レスポンス
export interface DeleteWordResponse {
  success: true;
  data: {
    id: string;
    japanese_meaning: string;
    is_active: false;
    deleted_at: string;
  };
}

// ページネーション情報
export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
  total_pages: number;
}

// 単語リスト項目
export interface WordListItem {
  id: string;
  japanese_meaning: string;
  answers: string[];
  synonyms: string[];
  is_active: boolean;
  created_at: string;
}

// 単語検索レスポンス
export interface SearchWordsResponse {
  success: true;
  data: {
    words: WordListItem[];
    pagination: PaginationInfo;
  };
}

// エラーコード
export const AdminErrorCode = {
  INVALID_API_KEY: "INVALID_API_KEY",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_WORD: "DUPLICATE_WORD",
  WORD_NOT_FOUND: "WORD_NOT_FOUND",
  WORD_ALREADY_DELETED: "WORD_ALREADY_DELETED",
  DATABASE_ERROR: "DATABASE_ERROR",
  MISSING_FIELDS: "MISSING_FIELDS",
} as const;

export type AdminErrorCodeType = (typeof AdminErrorCode)[keyof typeof AdminErrorCode];

// バッチ作成リクエスト
export interface BatchCreateWordRequest {
  words: CreateWordRequest[];
}

// バッチ作成時の個別エラー情報
export interface BatchWordError {
  index: number;
  japanese_meaning: string;
  error: string;
}

// バッチ作成レスポンス
export interface BatchCreateWordResponse {
  success: true;
  data: {
    created: number;
    failed: number;
    errors: BatchWordError[];
  };
}
