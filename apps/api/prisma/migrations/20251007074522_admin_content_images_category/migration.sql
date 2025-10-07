-- AlterTable
ALTER TABLE "public"."News" ADD COLUMN     "category" TEXT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Promotion" ADD COLUMN     "category" TEXT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
