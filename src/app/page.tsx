"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function HomePage() {
  const { isLoggedIn, user } = useAuth();

  return (
    <MainLayout className="container mx-auto px-4 py-8">
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">英単語練習アプリ</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {isLoggedIn && user
              ? `${user.displayName}さん、今日も頑張りましょう！`
              : "日本語から英単語を入力する形式で効率的に学習しましょう"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {isLoggedIn ? (
            <>
              <Button asChild size="lg">
                <Link href="/learn">学習を開始</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={"/stats" as any}>統計を見る</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/login">学習を始める</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">機能を見る</Link>
              </Button>
            </>
          )}
        </div>

        <div id="features" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>学習の特徴</CardTitle>
              <CardDescription>効率的な英単語学習システム</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">• 日本語→英語の入力形式</p>
              <p className="text-sm">• 1セッション10問</p>
              <p className="text-sm">• 複数の正解候補に対応</p>
              <p className="text-sm">• 学習履歴で進捗管理</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>学習アルゴリズム</CardTitle>
              <CardDescription>最適な出題比率で効率的学習</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">• 過去正解: 20%</p>
              <p className="text-sm">• 過去不正解: 40%</p>
              <p className="text-sm">• 新規単語: 40%</p>
              <p className="text-sm">• 弱点を重点的に学習</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
