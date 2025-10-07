/*
  Warnings:

  - Added the required column `publicId` to the `UserDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."UserDocument" ADD COLUMN     "publicId" TEXT NOT NULL;
