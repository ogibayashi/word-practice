// ローカルストレージを使った簡易認証ユーティリティ

const USER_STORAGE_KEY = "word-practice-user";

export interface LocalUser {
  id: string;
  displayName: string;
  createdAt: string;
}

// ユーザー情報をローカルストレージに保存
export function saveUserToStorage(displayName: string): LocalUser {
  const user: LocalUser = {
    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    displayName: displayName.trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    console.error("Failed to save user to localStorage:", error);
    throw new Error("ユーザー情報の保存に失敗しました");
  }
}

// ローカルストレージからユーザー情報を取得
export function getUserFromStorage(): LocalUser | null {
  try {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return null;

    const user = JSON.parse(userJson) as LocalUser;

    // 基本的なバリデーション
    if (!user.id || !user.displayName || !user.createdAt) {
      console.warn("Invalid user data in localStorage");
      clearUserFromStorage();
      return null;
    }

    return user;
  } catch (error) {
    console.error("Failed to get user from localStorage:", error);
    clearUserFromStorage();
    return null;
  }
}

// ユーザー情報をローカルストレージから削除
export function clearUserFromStorage(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear user from localStorage:", error);
  }
}

// ユーザーがログイン済みかどうかをチェック
export function isUserLoggedIn(): boolean {
  return getUserFromStorage() !== null;
}

// ユーザー名のバリデーション
export function validateDisplayName(displayName: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: "名前を入力してください",
    };
  }

  if (trimmed.length < 1) {
    return {
      isValid: false,
      error: "名前は1文字以上で入力してください",
    };
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: "名前は50文字以内で入力してください",
    };
  }

  // 特殊文字のチェック（基本的な文字のみ許可）
  const validNameRegex =
    /^[a-zA-Z0-9ひらがなカタカナ漢字\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s]+$/;
  if (!validNameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "名前に使用できない文字が含まれています",
    };
  }

  return { isValid: true };
}
