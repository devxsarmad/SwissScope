import { prisma } from "../prisma/client.js";
import { pruneIrrelevantJobs } from "../services/job.service.js";

try {
  const result = await pruneIrrelevantJobs();
  console.log(`Pruned irrelevant jobs from PostgreSQL (${result.deleted} deleted, ${result.scanned} scanned)`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to prune irrelevant jobs: ${message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
