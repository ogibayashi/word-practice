"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export function Header() {
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-foreground">
          英単語練習
        </Link>

        <nav className="flex items-center space-x-4">
          {isLoggedIn && (
            <>
              <Link
                href="/learn"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                学習
              </Link>
              <Link
                href="/stats"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                統計
              </Link>
            </>
          )}

          {isLoggedIn && user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">{user.displayName}さん</span>
              <Button variant="outline" size="sm" onClick={logout}>
                ログアウト
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">ログイン</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
