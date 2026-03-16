-- AlterTable
ALTER TABLE "evaluations" ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "finalizedById" TEXT;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
