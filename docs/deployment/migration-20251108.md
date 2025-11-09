# マイグレーション手順: 単語管理API（PR #11）

## 概要
PR #11 の単語管理API実装に伴い、`words`テーブルにソフトデリート用のカラムを追加します。

## マイグレーション内容

### 追加されるカラム
- `is_active` (BOOLEAN NOT NULL DEFAULT true) - アクティブ状態フラグ
- `deleted_at` (TIMESTAMP NULL) - 削除日時

### マイグレーションSQL
```sql
ALTER TABLE "words" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "words" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
```

## 既存データへの影響

### 安全性
✅ **データの破壊的変更なし**
- 既存のレコードは保持される
- `is_active`は自動的に`true`に設定される（DEFAULT値）
- `deleted_at`は`NULL`に設定される（NULL許容カラム）

### 影響範囲
- 既存の単語データはすべてアクティブ状態（`is_active: true`）として扱われる
- 出題対象に含まれ続ける（既存の動作と同じ）
- 学習履歴への影響なし

## デプロイ手順

### 前提条件
- PR #11 がマージされていること
- 本番環境の`ADMIN_API_KEY`が設定されていること

### ステップ1: バックアップ確認（推奨）
Neon PostgreSQL では自動バックアップが有効になっていますが、念のため確認：

1. [Neon Console](https://console.neon.tech/) にログイン
2. プロジェクトの「Backups」タブで自動バックアップが有効か確認
3. 必要に応じて手動バックアップを作成

### ステップ2: マイグレーション実行

#### 方法1: Vercel Functions経由（推奨）

Vercelにデプロイされると、自動的にPrismaの設定が適用されますが、マイグレーションは**手動で実行する必要があります**。

1. ローカル環境で本番DBに接続してマイグレーション実行：

```bash
# 本番環境のDATABASE_URLを設定
export DATABASE_URL="<本番のNeon PostgreSQL URL>"

# マイグレーション実行（本番用）
npx prisma migrate deploy

# 実行確認
npx prisma db pull
```

#### 方法2: Neon Console経由

1. [Neon Console](https://console.neon.tech/) にログイン
2. プロジェクトの「SQL Editor」を開く
3. 以下のSQLを実行：

```sql
-- マイグレーション実行
ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- 確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'words'
AND column_name IN ('is_active', 'deleted_at');
```

### ステップ3: デプロイ確認

1. **アプリケーションの動作確認**
   ```bash
   # ヘルスチェック
   curl https://your-app-domain.vercel.app/api/health
   ```

2. **マイグレーション確認**
   ```bash
   # Prisma Studioで確認（ローカル環境）
   export DATABASE_URL="<本番URL>"
   npx prisma studio
   ```

3. **管理API動作確認**
   ```bash
   # 単語検索APIテスト（既存データが取得できることを確認）
   curl -X GET "https://your-app-domain.vercel.app/api/admin/words?limit=5" \
     -H "Authorization: Bearer ${ADMIN_API_KEY}"
   ```

### ステップ4: 動作テスト

以下の操作が正常に動作することを確認：

- ✅ 既存の単語が出題される
- ✅ 学習機能が正常に動作する
- ✅ 単語の追加・更新・削除（管理API）が動作する
- ✅ 削除した単語が出題対象から除外される

## ロールバック手順（緊急時）

万が一、問題が発生した場合のロールバック手順：

### データベースのロールバック

```sql
-- カラムを削除（データは保持される）
ALTER TABLE "words" DROP COLUMN IF EXISTS "is_active";
ALTER TABLE "words" DROP COLUMN IF EXISTS "deleted_at";
```

### アプリケーションのロールバック

1. Vercel Dashboardで前のデプロイメントに戻す
2. または、GitHubでPR #11 をリバート

## トラブルシューティング

### マイグレーションエラーが発生した場合

**エラー**: `column "is_active" already exists`
```bash
# 解決: IF NOT EXISTS を使用
ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
```

**エラー**: Permission denied
```bash
# 解決: DATABASE_URLが正しいか確認
echo $DATABASE_URL
# Neonの接続URLにsslmode=requireが含まれているか確認
```

### 既存データが取得できない場合

1. データベース接続を確認
   ```bash
   npx prisma db pull
   ```

2. `is_active`フィルタが正しいか確認
   ```typescript
   // src/lib/db/queries.ts
   where: {
     isActive: true, // この行が追加されていることを確認
   }
   ```

## 確認事項チェックリスト

デプロイ前:
- [ ] PR #11 がマージされている
- [ ] 本番環境に`ADMIN_API_KEY`が設定されている
- [ ] Neonの自動バックアップが有効

デプロイ後:
- [ ] マイグレーションが正常に完了した
- [ ] `words`テーブルに`is_active`と`deleted_at`カラムが追加されている
- [ ] 既存の単語データが保持されている
- [ ] 学習機能が正常に動作する
- [ ] 管理API（追加・更新・削除）が動作する
- [ ] 削除した単語が出題対象から除外される

## 参考情報

- **マイグレーションファイル**: `prisma/migrations/20251108085446_add_word_soft_delete_fields/migration.sql`
- **PR**: https://github.com/ogibayashi/word-practice/pull/11
- **Prisma ドキュメント**: https://www.prisma.io/docs/guides/migrate/production-troubleshooting

---

**注意**: 本番環境でのマイグレーション実行は慎重に行ってください。必ずバックアップを確認してから実行してください。
