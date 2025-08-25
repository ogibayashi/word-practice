# アーキテクチャ設計

## レイヤー構成

このアプリケーションは以下の3層アーキテクチャで構成されています：

### 1. APIエンドポイント層 (`src/app/api/`)

**責務:**
- HTTP リクエスト/レスポンス処理
- 入力値のバリデーション
- HTTPステータスコード管理
- サービス層の呼び出し

**やってはいけないこと:**
- 直接的なデータベース操作
- ビジネスロジックの実装
- 複雑なデータ変換処理

**例:**
```typescript
export async function POST(request: NextRequest) {
  // バリデーション
  const validation = CreateSessionSchema.safeParse(body);
  
  // サービス層の呼び出し
  const sessionResponse = await sessionService.createSession(userId, totalQuestions);
  
  // HTTPレスポンス
  return NextResponse.json(sessionResponse);
}
```

### 2. ビジネスロジック層 (`src/lib/services/`)

**責務:**
- ビジネスルールの実装
- 複数のデータアクセス操作の組み合わせ
- ドメインロジック（出題アルゴリズムなど）
- データの変換・整形

**やってはいけないこと:**
- HTTP関連の処理
- 直接的なPrismaクライアントの使用（データアクセス層経由）

**例:**
```typescript
// sessionService.ts
export async function createSession(userId: string, totalQuestions: number) {
  // ビジネスルール: ユーザー存在確認
  await userQueries.validateUser(userId);
  
  // ビジネスルール: 出題可能な単語数チェック
  await validateWordCount(totalQuestions);
  
  // セッション作成とランダム問題選択
  return await createSessionWithRandomQuestions(userId, totalQuestions);
}
```

### 3. データアクセス層 (`src/lib/db/`)

**責務:**
- 純粋なCRUD操作
- 単一テーブルに対する基本的なクエリ
- データベーススキーマの抽象化

**やってはいけないこと:**
- ビジネスロジックの実装
- 複雑な条件分岐
- HTTP関連の処理

**例:**
```typescript
// queries.ts
export const userQueries = {
  async findById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  },
  
  async create(data: CreateUserData) {
    return await prisma.user.create({ data });
  }
};
```

## ディレクトリ構造

```
src/
├── app/api/              # APIエンドポイント層
│   ├── sessions/         # セッション関連API
│   └── users/           # ユーザー関連API
├── lib/
│   ├── db/              # データアクセス層
│   │   ├── client.ts    # Prismaクライアント
│   │   ├── queries.ts   # CRUD操作
│   │   └── types.ts     # DB型定義
│   └── services/        # ビジネスロジック層
│       ├── sessionService.ts  # セッション管理
│       ├── userService.ts     # ユーザー管理
│       └── questionService.ts # 出題ロジック
└── types/               # 共通型定義
```

## データフロー

```
HTTP Request
    ↓
API Layer (route.ts)
    ├── バリデーション
    ├── エラーハンドリング
    └── サービス層呼び出し
        ↓
Service Layer
    ├── ビジネスルール実行
    ├── 複数クエリの組み合わせ
    └── データ変換
        ↓
Data Access Layer (queries.ts)
    ├── 単純なCRUD操作
    └── データベースアクセス
        ↓
HTTP Response
```

## 設計原則

### 単一責任原則
各レイヤーは明確に定義された責務のみを持つ

### 依存関係の方向
- API層 → Service層 → Data Access層
- 逆方向の依存は禁止

### エラーハンドリング
- Data Access層: データベースエラーをthrow
- Service層: ビジネスエラーをthrow
- API層: HTTPステータスコードに変換

### テスタビリティ
- 各レイヤーは独立してテスト可能
- Service層のUnit Test重視
- モック化しやすい設計

## リファクタリング指針

既存コードは段階的に以下の順序でリファクタリング：

1. **Service層の作成**: ビジネスロジックを分離
2. **Data Access層の整理**: CRUD操作のみに限定
3. **API層の簡略化**: HTTPハンドリングのみに集中
4. **テストの追加**: 各レイヤーごとのテスト作成

## 今後の拡張

- **Cache層**: Redis等のキャッシュ機能
- **Repository層**: より複雑なクエリが必要な場合
- **Domain層**: ドメインオブジェクトが複雑になった場合