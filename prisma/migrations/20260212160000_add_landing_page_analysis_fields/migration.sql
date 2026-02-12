-- AlterTable
ALTER TABLE "product_candidates" ADD COLUMN "landing_page_url" TEXT;
ALTER TABLE "product_candidates" ADD COLUMN "landing_page_data" JSONB;
ALTER TABLE "product_candidates" ADD COLUMN "analysis_status" TEXT;
ALTER TABLE "product_candidates" ADD COLUMN "analysis_error" TEXT;
ALTER TABLE "product_candidates" ADD COLUMN "analyzed_at" TIMESTAMP(3);
