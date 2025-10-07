-- CreateEnum
CREATE TYPE "public"."ConversationType" AS ENUM ('private', 'trade');

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "tradeId" INTEGER,
ADD COLUMN     "type" "public"."ConversationType" NOT NULL DEFAULT 'private';

-- CreateIndex
CREATE INDEX "Conversation_type_idx" ON "public"."Conversation"("type");

-- CreateIndex
CREATE INDEX "Conversation_tradeId_idx" ON "public"."Conversation"("tradeId");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "public"."Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
