"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect } from "react";

interface AuthGuardProps {
  redirectTo?: string;
}

// ログイン必須のページを保護するコンポーネント
export function AuthGuard({ children, redirectTo = "/login" }: PropsWithChildren<AuthGuardProps>) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push(redirectTo as never);
    }
  }, [isLoggedIn, isLoading, router, redirectTo]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    );
  }

  // 未ログイン状態（リダイレクト処理中）
  if (!isLoggedIn) {
    return null;
  }

  // ログイン済み - 子コンポーネントを表示
  return <>{children}</>;
}
