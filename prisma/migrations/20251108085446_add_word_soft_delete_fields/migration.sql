-- AlterTable
ALTER TABLE "words" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
