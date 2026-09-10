-- AlterTable
ALTER TABLE "Job" ADD COLUMN "postedAt" TIMESTAMPTZ(3),
ADD COLUMN "applicantCount" INTEGER;

-- CreateIndex
CREATE INDEX "Job_postedAt_idx" ON "Job"("postedAt");
