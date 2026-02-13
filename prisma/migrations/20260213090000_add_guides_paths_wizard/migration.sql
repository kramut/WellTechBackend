-- CreateTable
CREATE TABLE "guides" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "duration" TEXT,
    "difficulty" TEXT DEFAULT 'Media',
    "image_url" TEXT,
    "article_ids" INTEGER[],
    "product_ids" INTEGER[],
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_journeys" (
    "id" SERIAL NOT NULL,
    "goal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimated_duration" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "path_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wizard_recommendations" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "product_ids" INTEGER[],
    "article_ids" INTEGER[],
    "guide_ids" INTEGER[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wizard_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guides_slug_key" ON "guides"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "path_journeys_goal_id_key" ON "path_journeys"("goal_id");

-- CreateIndex
CREATE UNIQUE INDEX "wizard_recommendations_category_key" ON "wizard_recommendations"("category");
