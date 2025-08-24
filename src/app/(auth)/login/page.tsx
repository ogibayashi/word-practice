"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(displayName);
    if (result.success) {
      router.push("/learn");
    } else {
      setError(result.error || "ログインに失敗しました");
    }
  };

  return (
    <MainLayout className="container mx-auto px-4 py-8">
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>ようこそ</CardTitle>
            <CardDescription>学習を開始するために、お名前を入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="お名前"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && <div className="text-sm text-destructive">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading || !displayName.trim()}>
                {isLoading ? "処理中..." : "学習を開始"}
              </Button>
            </form>

            <div className="mt-6 text-sm text-muted-foreground">
              <p>• 入力した名前は学習進捗の管理に使用されます</p>
              <p>• データはブラウザ内にのみ保存されます</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
