/*
  Warnings:

  - You are about to drop the column `type` on the `assets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serial_number]` on the table `assets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "assets" DROP COLUMN "type",
ADD COLUMN     "serial_number" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "written_description" TEXT;

-- CreateTable
CREATE TABLE "asset_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asset_id" TEXT NOT NULL,

    CONSTRAINT "asset_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_voice_notes" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asset_id" TEXT NOT NULL,

    CONSTRAINT "asset_voice_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_images_asset_id_idx" ON "asset_images"("asset_id");

-- CreateIndex
CREATE INDEX "asset_voice_notes_asset_id_idx" ON "asset_voice_notes"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_serial_number_key" ON "assets"("serial_number");

-- CreateIndex
CREATE INDEX "assets_name_idx" ON "assets"("name");

-- AddForeignKey
ALTER TABLE "asset_images" ADD CONSTRAINT "asset_images_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_voice_notes" ADD CONSTRAINT "asset_voice_notes_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
