"use client";

import type { LocalUser } from "@/lib/auth/localStorage";
import {
  clearUserFromStorage,
  getUserFromStorage,
  isUserLoggedIn,
  saveUserToStorage,
  validateDisplayName,
} from "@/lib/auth/localStorage";
import { useEffect, useState } from "react";

export interface UseAuthReturn {
  user: LocalUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にローカルストレージからユーザー情報を読み込み
  useEffect(() => {
    const savedUser = getUserFromStorage();
    setUser(savedUser);
    setIsLoading(false);
  }, []);

  // ログイン処理
  const login = async (displayName: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // バリデーション
      const validation = validateDisplayName(displayName);
      if (!validation.isValid) {
        setIsLoading(false);
        return {
          success: false,
          error: validation.error || "バリデーションエラー",
        };
      }

      // APIエンドポイント経由でデータベースにユーザーを作成
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("ログインAPIの呼び出しに失敗しました");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "ログインに失敗しました");
      }

      // APIから返されたユーザー情報をローカルストレージに保存
      const userData = result.data.user;
      const newUser: LocalUser = {
        id: userData.id,
        displayName: userData.displayName,
        createdAt: userData.createdAt,
      };

      // ローカルストレージに保存
      try {
        localStorage.setItem("word-practice-user", JSON.stringify(newUser));
      } catch (storageError) {
        console.error("Failed to save user to localStorage:", storageError);
      }

      setUser(newUser);
      setIsLoading(false);

      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : "ログインに失敗しました",
      };
    }
  };

  // ログアウト処理
  const logout = (): void => {
    clearUserFromStorage();
    setUser(null);
  };

  const isLoggedIn = user !== null;

  return {
    user,
    isLoading,
    isLoggedIn,
    login,
    logout,
  };
}
