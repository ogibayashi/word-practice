# 本番環境セットアップ手順

このドキュメントでは、英単語学習アプリを本番環境にデプロイする手順を説明します。

## 概要

- **ホスティング**: Vercel
- **データベース**: Neon PostgreSQL
- **認証**: NextAuth.js (LINE Login)
- **ドメイン**: Vercelの提供ドメインまたはカスタムドメイン

## 前提条件

以下のアカウントが必要です：
- [Vercel](https://vercel.com) アカウント
- [Neon](https://neon.tech) アカウント
- [LINE Developers](https://developers.line.biz/) アカウント（LINE Login用）

## 1. データベースセットアップ（Neon PostgreSQL）

### 1.1 Neonプロジェクトの作成

1. [Neon Console](https://console.neon.tech/) にログイン
2. 「New Project」をクリック
3. プロジェクト設定：
   - Project name: `word-practice-prod`
   - Region: `Asia Pacific (Tokyo)` を推奨
   - PostgreSQL version: 最新版
4. プロジェクトを作成

### 1.2 データベース接続URL取得

1. プロジェクトのDashboardで「Connection string」を確認
2. URLは以下の形式：
   ```
   postgresql://username:password@hostname:5432/database_name?sslmode=require
   ```
3. この接続URLを控えておく

### 1.3 マイグレーションファイルの生成（開発環境で実行）

開発環境でマイグレーションファイルを生成してからコミット：

```bash
# 開発環境のDATABASE_URLを設定（.envファイル）
DATABASE_URL="postgresql://dev_username:dev_password@dev_hostname:5432/dev_database_name?sslmode=require"

# 初回マイグレーション作成
npx prisma migrate dev --name init

# マイグレーションファイルをGitにコミット
git add prisma/migrations/
git commit -m "feat: add initial database migration"
```

### 1.4 本番環境でのデータベーススキーマ適用

```bash
# 本番用環境変数設定
export DATABASE_URL="postgresql://prod_username:prod_password@prod_hostname:5432/prod_database_name?sslmode=require"

# マイグレーション実行（本番用）
npx prisma migrate deploy

# シードデータ投入（初回のみ）
pnpm db:seed
```

## 2. LINE Login設定

### 2.1 LINE Developersプロジェクト作成

1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. 「新規プロバイダー作成」→「新規チャネル作成」→「LINEログイン」
3. チャネル基本設定：
   - チャネル名: `Word Practice App`
   - チャネル説明: `英単語学習アプリ`
   - アプリタイプ: `ウェブアプリ`

### 2.2 コールバックURL設定

1. チャネル設定の「LINEログイン設定」タブ
2. コールバックURL追加：
   ```
   https://your-app-domain.vercel.app/api/auth/callback/line
   ```
3. 「ウェブアプリでLINEログインを利用する」を有効化

### 2.3 チャネルID・シークレット取得

- **チャネルID**: チャネル基本設定で確認
- **チャネルシークレット**: チャネル設定の「チャネルシークレット」で確認

## 3. Vercelデプロイ設定

### 3.1 Vercelプロジェクト作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. 「New Project」→「Import Git Repository」
3. GitHubリポジトリを選択してインポート

### 3.2 環境変数設定

Vercel Dashboardの「Settings」→「Environment Variables」で以下を設定：

```bash
# データベース
DATABASE_URL=postgresql://username:password@hostname:5432/database_name?sslmode=require

# NextAuth.js
NEXTAUTH_URL=https://your-app-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret-32-characters-or-more

# LINE Login
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret

# 管理API認証（単語管理API用）
ADMIN_API_KEY=your-admin-api-key-for-word-management

# 本番環境フラグ
NODE_ENV=production
```

#### 環境変数の説明

- **DATABASE_URL**: Neon PostgreSQLの接続URL
- **NEXTAUTH_URL**: アプリケーションのベースURL（Vercelのドメイン）
- **NEXTAUTH_SECRET**: NextAuth.jsのセッション暗号化キー（32文字以上のランダム文字列）
- **LINE_CHANNEL_ID**: LINE LoginのチャネルID
- **LINE_CHANNEL_SECRET**: LINE Loginのチャネルシークレット
- **ADMIN_API_KEY**: 単語管理API（POST/PUT/DELETE /api/admin/words）の認証キー
  - 安全な方法で生成（例: `openssl rand -base64 32`）
  - 外部に漏洩しないよう厳重に管理
  - CSVインポート機能など管理者向け操作で使用
- **NODE_ENV**: 本番環境フラグ

#### セキュリティに関する注意事項

1. **ADMIN_API_KEY の生成**:
   ```bash
   # ターミナルで実行
   openssl rand -base64 32
   ```

2. **環境変数の管理**:
   - すべての機密情報はVercelの環境変数として設定
   - `.env`ファイルは絶対にGitにコミットしない
   - 定期的にキーをローテーション（特にADMIN_API_KEY）

3. **アクセス制御**:
   - ADMIN_API_KEYは管理者のみが知るべき情報
   - APIキーは安全な方法で共有（パスワードマネージャー等）

### 3.3 ビルド設定

`vercel.json` ファイルを作成（プロジェクトルート）：

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 3.4 デプロイ実行

```bash
# Vercel CLIを使用する場合
npx vercel --prod

# または、GitHubにpushすることで自動デプロイ
git push origin main
```

## 4. 初回デプロイ後の設定

### 4.1 データベース初期化

Vercel Functionsを使用してデータベースを初期化：

1. `src/app/api/admin/init/route.ts` を作成：
```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 認証チェック（管理者のみ実行可能にする）
    const { authorization } = Object.fromEntries(request.headers);
    if (authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // データベース初期化処理
    // ここでシードデータの投入などを行う
    
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({ error: 'Initialization failed' }, { status: 500 });
  }
}
```

2. 環境変数に `ADMIN_SECRET` を追加
3. APIを呼び出してデータベースを初期化

### 4.2 ヘルスチェック設定

`src/app/api/health/route.ts` を作成：

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    }, { status: 500 });
  }
}
```

## 5. カスタムドメイン設定（オプション）

### 5.1 ドメイン取得・DNS設定

1. 独自ドメインを取得
2. DNS設定でCNAMEレコードを追加：
   ```
   your-app-domain.com → cname.vercel-dns.com
   ```

### 5.2 Vercelドメイン設定

1. Vercel Dashboard → Settings → Domains
2. 「Add Domain」で独自ドメインを追加
3. SSL証明書の自動発行を待つ

### 5.3 LINE Login URL更新

LINE Developers Consoleでコールバック URLを更新：
```
https://your-app-domain.com/api/auth/callback/line
```

## 6. モニタリング・ログ設定

### 6.1 Vercel Analytics

1. Vercel Dashboard → Analytics タブ
2. 「Enable Analytics」で有効化

### 6.2 ログ監視

本番環境でのエラーログは以下で確認：
- Vercel Dashboard → Functions → Logs
- Neon Console → Monitoring

## 7. デプロイ後チェックリスト

- [ ] アプリケーションが正常に起動する
- [ ] データベース接続が成功する
- [ ] LINE Loginが動作する
- [ ] 学習機能が正常動作する
- [ ] 管理API（単語管理）が認証付きで動作する
- [ ] ADMIN_API_KEY が正しく設定されている
- [ ] レスポンス時間が適切である
- [ ] SSL証明書が有効である
- [ ] SEOメタタグが設定されている

## 8. 継続運用

### 8.1 定期的な作業

- データベースのバックアップ確認（Neonで自動実行）
- パフォーマンス監視
- セキュリティ更新の適用
- 依存関係の更新

### 8.2 スケールアップ対応

ユーザー数が増加した場合の対応：
- Neonプランのアップグレード
- Vercelプランのアップグレード  
- CDNの導入検討
- データベース最適化

## トラブルシューティング

### よくある問題と解決方法

1. **データベース接続エラー**
   - 接続URL形式の確認
   - Neonプロジェクトの状態確認
   - 環境変数の設定確認

2. **LINE Loginエラー**
   - コールバックURLの設定確認
   - チャネルID/シークレットの確認
   - HTTPSでのアクセス確認

3. **ビルドエラー**
   - Node.jsバージョンの確認
   - 依存関係の整合性確認
   - 型エラーの修正

4. **パフォーマンス問題**
   - データベースクエリの最適化
   - 画像・アセットの最適化
   - キャッシュ設定の見直し

---

**注意**: 本番環境の認証情報は絶対にGitリポジトリにコミットしないでください。すべての機密情報は環境変数として設定してください。