# NEONデータベース接続セットアップ手順

## 1. NEONから接続文字列を取得
1. [Neon Console](https://console.neon.tech/) にログイン
2. プロジェクト選択 → "Connection Details"
3. 接続文字列をコピー（形式例）:
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
   ```

## 2. .envファイルを更新
```bash
# .env ファイルのDATABASE_URLを実際の接続文字列に置き換え
DATABASE_URL="postgresql://your-actual-connection-string"
```

## 3. Prismaクライアント生成
```bash
pnpm prisma generate
```

## 4. データベースマイグレーション実行
```bash
pnpm prisma db push
```

## 5. テストデータ投入
```bash
pnpm db:seed
```

## 6. 接続確認
```bash
pnpm prisma studio
# または
pnpm dev
```

## ⚠️ 注意事項
- 接続文字列には機密情報が含まれるため、.envファイルはGitにコミットしない
- NEONの無料プランでは接続数制限があるため注意
- SSL接続（sslmode=require）が必要

## 🔧 トラブルシューティング
- 接続エラーが発生する場合: NEONのプロジェクトが起動状態か確認
- マイグレーションエラー: `pnpm prisma db reset` で初期化
- シードエラー: `prisma/seed.ts` の内容を確認