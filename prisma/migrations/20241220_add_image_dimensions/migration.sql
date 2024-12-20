-- AlterTable
ALTER TABLE "Image" ADD COLUMN "width" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Image" ADD COLUMN "height" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Image" ADD COLUMN "thumbnailWidth" INTEGER;
ALTER TABLE "Image" ADD COLUMN "thumbnailHeight" INTEGER;

-- Convert thumbnail from String to Bytes
ALTER TABLE "Image" DROP COLUMN "thumbnail";
ALTER TABLE "Image" ADD COLUMN "thumbnail" BLOB;
