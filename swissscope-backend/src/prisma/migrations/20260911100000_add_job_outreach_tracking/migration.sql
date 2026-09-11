-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('NOT_STARTED', 'CONTACTED', 'FOLLOWED_UP', 'RESPONDED', 'INTERVIEWING', 'CLOSED');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "outreachStatus" "OutreachStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "notes" TEXT,
ADD COLUMN "contactName" TEXT,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "contactLinkedIn" TEXT,
ADD COLUMN "appliedAt" TIMESTAMPTZ(3),
ADD COLUMN "followUpAt" TIMESTAMPTZ(3),
ADD COLUMN "lastContactedAt" TIMESTAMPTZ(3),
ADD COLUMN "interviewNotes" TEXT;

-- CreateIndex
CREATE INDEX "Job_outreachStatus_idx" ON "Job"("outreachStatus");

-- CreateIndex
CREATE INDEX "Job_followUpAt_idx" ON "Job"("followUpAt");
