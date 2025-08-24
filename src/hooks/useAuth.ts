"use client";

import { useState, useEffect } from "react";
import type { LocalUser } from "@/lib/auth/localStorage";
import {
	getUserFromStorage,
	saveUserToStorage,
	clearUserFromStorage,
	isUserLoggedIn,
	validateDisplayName,
} from "@/lib/auth/localStorage";

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
					error: validation.error,
				};
			}

			// ユーザー情報を保存
			const newUser = saveUserToStorage(displayName);
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