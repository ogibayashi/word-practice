# データベースセットアップ手順

## 1. Neon PostgreSQL設定

### アカウント作成・データベース作成
1. [Neon](https://neon.tech/) にアクセス
2. アカウント作成またはログイン
3. 新しいプロジェクトを作成
4. プロジェクト名: `word-practice`
5. データベース名: `word_practice_db`

### 接続文字列の取得
1. Neonダッシュボードでプロジェクトを選択
2. "Connection Details" から接続文字列をコピー
3. `.env` ファイルの `DATABASE_URL` を実際の接続文字列に置き換え

### 接続文字列の例
```bash
DATABASE_URL="postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/word_practice_db?sslmode=require"
```

## 2. マイグレーション実行手順

実際のデータベース接続情報を設定後、以下のコマンドを実行:

```bash
# 初回マイグレーション実行
pnpm prisma migrate dev --name init

# データベーススキーマ確認
pnpm prisma studio
```

## 3. 必要なインデックス追加

マイグレーション完了後、パフォーマンス向上のため以下のSQLを実行:

```sql
-- パフォーマンス向上用インデックス
CREATE INDEX idx_learning_history_user_word ON learning_history(user_id, word_id);
CREATE INDEX idx_learning_history_session ON learning_history(session_id);
CREATE INDEX idx_word_answers_word_id ON word_answers(word_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

## 4. 設定完了後の確認

```bash
# Prismaクライアント生成
pnpm prisma generate

# データベース接続確認
pnpm prisma db pull
```