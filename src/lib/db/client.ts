import { PrismaClient } from "@prisma/client";

// PrismaClient のグローバル型定義
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// データベース接続設定
export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});

// 開発環境では Hot Reload でのメモリリークを防ぐため、グローバルに保存
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;