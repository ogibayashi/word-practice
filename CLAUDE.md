# CLAUDE.md - English Word Practice App

このプロジェクトは英単語学習用のWebアプリケーションです。

## プロジェクト概要

- **目的**: 効率的な英単語学習アプリ（日本語→英語入力形式）
- **対象**: 数人の小規模利用
- **特徴**: 出題アルゴリズム（過去正解:過去不正解:新規 = 2:4:4）による学習最適化

## 技術スタック

### フロントエンド・バックエンド
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript (厳密設定)
- **スタイリング**: Tailwind CSS
- **コンポーネント**: shadcn/ui
- **開発ツール**: Biome (linter/formatter)
- **パッケージマネージャー**: pnpm

### データベース・認証
- **データベース**: Neon PostgreSQL
- **ORM**: Prisma
- **認証**: NextAuth.js (本番: LINE Login, 開発: 名前入力)
- **デプロイ**: Vercel

## 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# リンター実行
pnpm lint

# リンター自動修正
pnpm lint:fix

# 型チェック
pnpm type-check
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ルートグループ
│   ├── learn/             # 学習ページ
│   ├── stats/             # 統計ページ
│   └── api/               # API Routes
├── components/            # 再利用コンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   ├── features/         # 機能別コンポーネント
│   └── layout/           # レイアウト関連
├── lib/                  # ユーティリティ・設定
│   ├── db/              # データベース関連
│   ├── auth/            # 認証関連
│   └── utils/           # 汎用ユーティリティ
├── types/               # TypeScript型定義
└── hooks/               # カスタムReactフック
```

## データベース設計

### 主要テーブル
- `users` - ユーザー管理
- `words` - 単語マスタ
- `word_answers` - 単語の複数正解候補
- `learning_history` - 学習履歴
- `sessions` - 学習セッション

詳細は `docs/design.md` を参照。

## 実装フェーズ

### フェーズ1: 基本学習機能 (MVP) 🚧
- ✅ プロジェクト初期設定
- 🚧 データベース設計・セットアップ
- 🔲 基本UI構成
- 🔲 簡易認証機能
- 🔲 出題・回答機能
- 🔲 結果表示機能

### フェーズ2: 学習最適化
- 出題アルゴリズム実装
- 学習履歴の詳細管理
- 進捗統計表示

### フェーズ3: 運用機能
- LINE Login認証
- CSVインポート機能
- 管理者機能

## ドキュメント

- `docs/requirements.md` - 要件定義
- `docs/design.md` - 技術設計・アーキテクチャ
- `docs/implementation.md` - 実装計画・決定事項
- `docs/current-status.md` - 現在の進捗状況

## 次回作業予定

**データベース設計・セットアップ**から開始:
1. Prisma設定とスキーマ定義
2. Neon PostgreSQL接続設定
3. マイグレーション実行

## 重要な設計判断

- **型安全性重視**: TypeScript厳密設定でバグを事前防止
- **効率性重視**: pnpm + Biome で高速開発
- **モバイルファースト**: Tailwind CSSでレスポンシブ対応
- **段階的開発**: MVP重視で基本機能から実装

## トラブルシューティング

### pnpmエラーの場合
corepackを最新版に更新:
```bash
npm install -g corepack@latest
corepack enable
```

### 開発サーバーが起動しない場合
依存関係を再インストール:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## タスクの進め方

- docs/ に下に設計ドキュメントや実装上のメモを記載する.
- TODOリストや現在の進行状況は docs/current-status.mdに記載する
- 機能を実装する際はセットでunit testを書く
- 一つ一つのタスクは細かく保ち、完了ごとにgit commitする
