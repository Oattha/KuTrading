-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "postId" INTEGER,
ADD COLUMN     "tradeId" INTEGER;

-- CreateIndex
CREATE INDEX "Notification_postId_idx" ON "public"."Notification"("postId");

-- CreateIndex
CREATE INDEX "Notification_tradeId_idx" ON "public"."Notification"("tradeId");

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "public"."Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
