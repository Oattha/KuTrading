-- AlterEnum
ALTER TYPE "public"."MessageType" ADD VALUE 'video';

-- CreateTable
CREATE TABLE "public"."PostVideo" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,

    CONSTRAINT "PostVideo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PostVideo" ADD CONSTRAINT "PostVideo_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
