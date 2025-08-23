# 英単語学習Webアプリ 設計書

## 技術スタック選定

### 決定事項
- **フロントエンド・バックエンド**: Next.js (App Router)
- **デプロイ**: Vercel
- **想定規模**: 数人の小規模利用

### 選定理由
- モバイル最適化とSEOに有利なSSR/SSG対応
- フルスタックフレームワークで開発効率が高い
- Vercelとの統合が簡単
- 小規模なので複雑な構成は不要

## データベース選択

### 決定事項
- **データベース**: Neon PostgreSQL
- **ORM**: Prisma (TypeScript対応、マイグレーション管理が楽)

### 選定理由
- VercelとNeonの統合で設定が簡単
- 無料枠（500MB、100時間/月）で小規模利用に十分
- PostgreSQLの豊富な機能
- Prismaで型安全なデータベース操作

## 認証方式

### 決定事項
- **本番**: LINE Login
- **開発初期**: 名前入力（ローカルストレージ）
- **認証ライブラリ**: NextAuth.js (Auth.js)

### 選定理由
- LINE LoginはモバイルユーザーにとってUXが良い
- NextAuth.jsでLINE Provider対応
- 開発段階では簡易認証で開発速度重視

## API設計

### 決定事項
- **API方式**: Next.js API Routes (RESTful)
- **バリデーション**: Zod
- **型定義**: TypeScriptインターフェース

### 選定理由
- シンプルで学習コストが低い
- 標準的なREST APIで理解しやすい
- Zodでランタイムバリデーション追加
- 小規模なので型安全性はTypeScriptインターフェースで十分

### API エンドポイント設計
```
GET  /api/words/random     # ランダム出題用単語取得
POST /api/sessions         # 学習セッション開始
PUT  /api/sessions/:id     # 回答送信・セッション更新
GET  /api/users/:id/stats  # 学習統計取得
POST /api/words/import     # CSV単語インポート
```

## 状態管理

### 決定事項
- **セッション状態**: React標準 (useState + useContext)
- **ユーザー情報・学習統計**: データベースで管理
- **サーバー状態**: 必要時にfetch、状態管理ライブラリなし

### 選定理由
- 現在のセッションのみクライアント状態で管理（問題・回答・進捗）
- ユーザー情報と学習履歴は永続化が必要なのでDB管理
- 小規模なのでシンプルな構成で十分
- 必要時にAPI呼び出しで最新データ取得

### 管理する状態
- **クライアント**: 現在の問題、入力値、セッション進捗
- **サーバー**: ユーザー情報、単語データ、学習履歴、統計

## データベース設計

### テーブル構成

#### 1. users (ユーザー)
```sql
id            UUID          PRIMARY KEY
line_user_id  VARCHAR(255)  UNIQUE      -- LINE User ID
display_name  VARCHAR(100)  NOT NULL    -- 表示名
created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
```

#### 2. words (単語マスタ)
```sql
id               UUID         PRIMARY KEY
japanese_meaning TEXT         NOT NULL    -- 日本語の意味
synonyms         TEXT[]                   -- 類義語リスト
difficulty_level INTEGER      DEFAULT 1   -- 難易度（将来拡張用）
created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
```

#### 3. word_answers (正解候補)
```sql
id       UUID        PRIMARY KEY
word_id  UUID        NOT NULL REFERENCES words(id) ON DELETE CASCADE
answer   VARCHAR(255) NOT NULL    -- 英単語正解候補
is_primary BOOLEAN   DEFAULT FALSE -- 主要な答えかどうか
```

#### 4. learning_history (学習履歴)
```sql
id           UUID      PRIMARY KEY
user_id      UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE
word_id      UUID      NOT NULL REFERENCES words(id) ON DELETE CASCADE
session_id   UUID      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
is_correct   BOOLEAN   NOT NULL    -- 正解・不正解
user_answer  TEXT                  -- ユーザーの回答
answered_at  TIMESTAMP NOT NULL DEFAULT NOW()
```

#### 5. sessions (学習セッション)
```sql
id           UUID      PRIMARY KEY
user_id      UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE
total_questions INTEGER NOT NULL DEFAULT 10
completed_questions INTEGER NOT NULL DEFAULT 0
is_completed BOOLEAN   NOT NULL DEFAULT FALSE
started_at   TIMESTAMP NOT NULL DEFAULT NOW()
completed_at TIMESTAMP
```

### インデックス設計
```sql
-- パフォーマンス向上用
CREATE INDEX idx_learning_history_user_word ON learning_history(user_id, word_id);
CREATE INDEX idx_learning_history_session ON learning_history(session_id);
CREATE INDEX idx_word_answers_word_id ON word_answers(word_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

## 出題アルゴリズム設計

### 出題比率 (2:4:4)
- **過去正解単語**: 20% (2問)
- **過去不正解単語**: 40% (4問) 
- **未出題単語**: 40% (4問)

### クエリ設計

#### 1. 過去正解した単語を取得 (2問)
```sql
SELECT DISTINCT w.id, w.japanese_meaning 
FROM words w
JOIN learning_history lh ON w.id = lh.word_id
WHERE lh.user_id = $1 
  AND lh.is_correct = true
  AND NOT EXISTS (
    SELECT 1 FROM learning_history lh2 
    WHERE lh2.word_id = w.id AND lh2.user_id = $1 AND lh2.is_correct = false
    AND lh2.answered_at > lh.answered_at
  )
ORDER BY RANDOM()
LIMIT 2;
```

#### 2. 過去不正解した単語を取得 (4問)
```sql
SELECT DISTINCT w.id, w.japanese_meaning
FROM words w
JOIN learning_history lh ON w.id = lh.word_id
WHERE lh.user_id = $1 
  AND lh.is_correct = false
  AND NOT EXISTS (
    SELECT 1 FROM learning_history lh2 
    WHERE lh2.word_id = w.id AND lh2.user_id = $1 AND lh2.is_correct = true
    AND lh2.answered_at > lh.answered_at
  )
ORDER BY lh.answered_at DESC, RANDOM()
LIMIT 4;
```

#### 3. 未出題の単語を取得 (4問)
```sql
SELECT w.id, w.japanese_meaning
FROM words w
WHERE NOT EXISTS (
  SELECT 1 FROM learning_history lh 
  WHERE lh.word_id = w.id AND lh.user_id = $1
)
ORDER BY RANDOM()
LIMIT 4;
```

## CSVインポート機能設計

### CSV形式
```csv
japanese_meaning,primary_answer,alternative_answers,synonyms
走る,run,"jog,sprint","ジョギング,疾走"
美しい,beautiful,"pretty,gorgeous","きれい,素敵"
```

### インポート処理フロー
1. CSVファイルアップロード
2. パースとバリデーション
3. トランザクション内で一括挿入
   - words テーブルに単語追加
   - word_answers テーブルに正解候補追加
4. エラーハンドリングとロールバック

### バリデーション項目
- 必須フィールドチェック (japanese_meaning, primary_answer)
- 重複チェック (japanese_meaning)
- 文字数制限チェック
- 不正文字チェック