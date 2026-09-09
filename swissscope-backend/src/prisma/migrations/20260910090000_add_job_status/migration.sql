-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('NEW', 'SHORTLISTED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "status" "JobStatus" NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");
