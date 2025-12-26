-- CreateTable
CREATE TABLE "product_candidates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2),
    "affiliate_link" TEXT NOT NULL,
    "affiliate_program" TEXT NOT NULL,
    "commission_percentage" DECIMAL(5,2),
    "image_url" TEXT,
    "rating" DOUBLE PRECISION,
    "review_count" INTEGER,
    "source" TEXT NOT NULL,
    "source_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_candidates_pkey" PRIMARY KEY ("id")
);

