# API設計書

## 概要
このドキュメントはWord Practice アプリケーションのAPI仕様を定義します。

---

# 単語管理API

## 概要
管理者向けの単語追加・更新・削除機能をREST API形式で提供します。APIキー認証により外部からの意図しないアクセスを防止します。

## 認証方式

### APIキー認証
- **ヘッダー形式**: `Authorization: Bearer <API_KEY>`
- **環境変数**: `ADMIN_API_KEY`
- **認証エラー**: 401 Unauthorized

```bash
# 使用例
curl -X POST /api/admin/words \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"japanese_meaning": "走る", "answers": ["run", "jog"]}'
```

## エンドポイント一覧

### 1. 単語追加 API

**エンドポイント**: `POST /api/admin/words`

#### リクエスト仕様
```json
{
  "japanese_meaning": "走る",
  "answers": ["run", "jog", "sprint"],
  "synonyms": ["ジョギング", "疾走"]
}
```

#### バリデーション
- `japanese_meaning`: 必須、1-500文字、重複チェック
- `answers`: 必須、配列（1-10個）、各要素1-255文字、空文字不可
- `synonyms`: オプション、配列（0-20個）、各要素1-100文字

#### レスポンス仕様
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "japanese_meaning": "走る",
    "answers": [
      {
        "id": "cly1234567890",
        "answer": "run",
        "is_primary": true
      },
      {
        "id": "cly1234567891",
        "answer": "jog",
        "is_primary": false
      }
    ],
    "synonyms": ["ジョギング", "疾走"],
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### エラーレスポンス例
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_WORD",
    "message": "この日本語の意味は既に登録されています",
    "details": {
      "field": "japanese_meaning",
      "value": "走る"
    }
  }
}
```

### 2. 単語更新 API

**エンドポイント**: `PUT /api/admin/words/:id`

#### リクエスト仕様
```json
{
  "japanese_meaning": "速く走る", // オプション
  "answers": ["run", "sprint", "dash"], // オプション、全置換
  "synonyms": ["ダッシュ", "疾走"] // オプション、全置換
}
```

#### バリデーション
- 少なくとも1つのフィールドが必要
- 各フィールドのバリデーションは追加APIと同様
- `japanese_meaning`更新時は重複チェック（自分以外）

#### レスポンス仕様
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "japanese_meaning": "速く走る",
    "answers": [
      {
        "id": "cly1234567892",
        "answer": "run",
        "is_primary": true
      },
      {
        "id": "cly1234567893",
        "answer": "sprint",
        "is_primary": false
      }
    ],
    "synonyms": ["ダッシュ", "疾走"],
    "updated_at": "2024-01-01T01:00:00.000Z"
  }
}
```

### 3. 単語削除 API

**エンドポイント**: `DELETE /api/admin/words/:id`

#### 削除方式
- **ソフトデリート**: `is_active`フラグを`false`に設定
- **学習履歴保護**: 既存の学習履歴は保持
- **出題除外**: 新しい出題対象から除外

#### レスポンス仕様
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "japanese_meaning": "走る",
    "is_active": false,
    "deleted_at": "2024-01-01T02:00:00.000Z"
  }
}
```

### 4. 単語検索 API（管理用）

**エンドポイント**: `GET /api/admin/words`

#### クエリパラメータ
- `search`: 日本語の意味で部分一致検索
- `is_active`: アクティブ状態フィルタ（true/false/all、デフォルト: true）
- `limit`: 取得件数（1-100、デフォルト: 20）
- `offset`: オフセット（デフォルト: 0）

#### 使用例
```bash
GET /api/admin/words?search=走&is_active=all&limit=10&offset=0
```

#### レスポンス仕様
```json
{
  "success": true,
  "data": {
    "words": [
      {
        "id": "clx1234567890",
        "japanese_meaning": "走る",
        "answers": ["run", "jog"],
        "synonyms": ["ジョギング"],
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 10,
      "offset": 0,
      "has_next": true,
      "total_pages": 15
    }
  }
}
```

## データベース変更

### wordsテーブルの変更
既存のスキーマに`is_active`フラグを追加：

```sql
-- マイグレーション
ALTER TABLE words ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE words ADD COLUMN deleted_at TIMESTAMP NULL;

-- インデックス追加（パフォーマンス最適化）
CREATE INDEX idx_words_is_active ON words(is_active);
CREATE INDEX idx_words_japanese_meaning ON words(japanese_meaning);

-- 複合インデックス（検索とフィルタリングの最適化）
CREATE INDEX idx_words_active_meaning ON words(is_active, japanese_meaning);

-- 将来の拡張: 全文検索用インデックス（実装時に追加）
-- CREATE INDEX idx_words_fulltext ON words USING gin(to_tsvector('japanese', japanese_meaning));
```

### Prismaスキーマ更新
```typescript
model Word {
  id              String    @id @default(cuid())
  japaneseMeaning String    @map("japanese_meaning") @db.Text
  synonyms        String[]
  difficultyLevel Int       @default(1) @map("difficulty_level")
  isActive        Boolean   @default(true) @map("is_active")
  createdAt       DateTime  @default(now()) @map("created_at")
  deletedAt       DateTime? @map("deleted_at")

  answers         WordAnswer[]
  learningHistory LearningHistory[]

  @@map("words")
}
```

## エラーハンドリング

### HTTPステータスコード
- **200**: 成功（GET、PUT、DELETE）
- **201**: 作成成功（POST）
- **400**: バリデーションエラー
- **401**: 認証エラー
- **404**: リソースが見つからない
- **409**: 重複エラー
- **500**: サーバーエラー

### エラーレスポンス統一形式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人間が読める日本語メッセージ",
    "details": {} // 追加情報（オプション）
  }
}
```

### エラーコード一覧
- `INVALID_API_KEY`: APIキーが無効
- `VALIDATION_ERROR`: バリデーションエラー
- `DUPLICATE_WORD`: 日本語意味の重複
- `WORD_NOT_FOUND`: 指定された単語が見つからない
- `WORD_ALREADY_DELETED`: 既に削除済みの単語
- `DATABASE_ERROR`: データベースエラー

## 実装上の考慮事項

### トランザクション管理
単語と正解候補の作成・更新は一つのトランザクション内で実行：

```typescript
await prisma.$transaction(async (tx) => {
  // 単語の作成/更新
  const word = await tx.word.create({...});
  
  // 正解候補の作成（更新時は既存削除 → 新規作成）
  await tx.wordAnswer.deleteMany({
    where: { wordId: word.id }
  });
  
  await tx.wordAnswer.createMany({
    data: answers.map((answer, index) => ({
      wordId: word.id,
      answer,
      isPrimary: index === 0
    }))
  });
});
```

### 正解候補の管理方針
- **追加時**: 最初の要素を`is_primary: true`に設定
- **更新時**: 既存の正解候補をすべて削除して新規作成（全置換）
- **シンプルな管理**: 部分更新ではなく全置換でデータ整合性を保証

### 学習履歴の保護
- ソフトデリートにより既存の学習履歴への参照を保持
- 出題アルゴリズムで`is_active: true`の単語のみ対象
- 統計情報は削除済み単語も含めて計算（学習実績の保持）

### セキュリティ考慮事項

#### 認証・認可
- **APIキーの環境変数管理**: `ADMIN_API_KEY`を環境変数で管理
- **APIキーローテーション**: 定期的なキー更新の仕組み（将来実装予定）
- **複数APIキー対応**: 個別アクセス管理と監査ログ（将来実装予定）
- **レート制限**: APIの過剰利用防止（将来実装予定）

#### データ保護
- **SQLインジェクション対策**: Prisma ORMのパラメータ化クエリを使用
- **XSS対策**:
  - HTMLタグのエスケープ処理
  - 入力値のホワイトリスト検証
- **入力サニタイゼーション**:
  - 制御文字の除去
  - 最大長制限の強制
  - 特殊文字の適切なエスケープ

### パフォーマンス最適化

#### データベースクエリ最適化
- **インデックス戦略**:
  - 単一カラムインデックス: `is_active`, `japanese_meaning`
  - 複合インデックス: `(is_active, japanese_meaning)` で検索とフィルタリングを高速化
  - 将来の拡張: PostgreSQLの全文検索（GINインデックス）で部分一致検索を最適化
- **ページネーション**:
  - OFFSET/LIMIT方式を使用（初期実装）
  - 大規模データ時はカーソルベースページネーションへの移行を検討
- **N+1問題の回避**:
  - Prismaの`include`を使用して単語と正解候補を一括取得

#### 回答管理の最適化
- **現在の実装**: 全置換方式（シンプルさと整合性を優先）
- **将来の最適化**: 差分更新アルゴリズムの導入（大量データ時）
  - 追加・削除・変更を個別に検出して最小限の操作で更新

#### キャッシュ戦略（将来実装）
- 頻繁にアクセスされる単語データのメモリキャッシュ
- Redis等を使用した分散キャッシュ

## テスト方針

### 単体テスト項目
- バリデーション機能のテスト
- 認証機能のテスト
- データベース操作のテスト
- エラーハンドリングのテスト

### 統合テスト項目
- API エンドポイントの動作テスト
- トランザクションの整合性テスト
- 学習履歴との関連性テスト

## 今後の拡張性

### バッチ処理機能（将来）
```json
POST /api/admin/words/batch
{
  "operation": "create", // create/update/delete
  "words": [
    {
      "japanese_meaning": "走る",
      "answers": ["run", "jog"]
    }
  ]
}
```

### カテゴリ機能（将来）
- 単語カテゴリの追加
- カテゴリ別管理機能
- 難易度別学習モード

### 監査ログ機能（将来）
- API操作履歴の記録
- 変更前後の差分記録
- 管理者操作の追跡

---

<!-- 今後、他のAPI設計をここに追加 -->