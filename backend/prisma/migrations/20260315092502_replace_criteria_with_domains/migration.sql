/*
  Warnings:

  - You are about to drop the `criteria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `criteria_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluation_results` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "criteria" DROP CONSTRAINT "criteria_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "evaluation_results" DROP CONSTRAINT "evaluation_results_criterionId_fkey";

-- DropForeignKey
ALTER TABLE "evaluation_results" DROP CONSTRAINT "evaluation_results_evaluationId_fkey";

-- DropTable
DROP TABLE "criteria";

-- DropTable
DROP TABLE "criteria_categories";

-- DropTable
DROP TABLE "evaluation_results";

-- CreateTable
CREATE TABLE "evaluation_domains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_sections" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "note" TEXT,
    "indicator" "EvaluationIndicator",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_domains_name_key" ON "evaluation_domains"("name");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_sections_evaluationId_domainId_key" ON "evaluation_sections"("evaluationId", "domainId");

-- AddForeignKey
ALTER TABLE "evaluation_sections" ADD CONSTRAINT "evaluation_sections_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_sections" ADD CONSTRAINT "evaluation_sections_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "evaluation_domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
