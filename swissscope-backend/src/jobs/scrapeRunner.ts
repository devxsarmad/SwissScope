import { getScraper } from "../scrapers/index.js";
import { prisma } from "../prisma/client.js";
import { saveJobs } from "../services/job.service.js";

const scraperName = process.argv[2] || "swissdevjobs";
const shouldSave = process.argv.includes("--save");
const scraper = getScraper(scraperName);

try {
  const jobs = await scraper.scrape();

  console.log(`Fetched ${jobs.length} jobs from ${scraper.source}`);
  for (const job of jobs) {
    console.log(`- ${job.title} | ${job.company} | ${job.location || "Unknown location"} | ${job.url}`);
    if (job.techStack.length > 0) {
      console.log(`  Tech: ${job.techStack.join(", ")}`);
    }
    if (job.workload) {
      console.log(`  Workload: ${job.workload}`);
    }
  }

  if (jobs.length === 0) {
    process.exitCode = 1;
  }

  if (shouldSave && jobs.length > 0) {
    const result = await saveJobs(jobs);
    console.log(`Saved ${result.total} jobs to PostgreSQL (${result.created} created, ${result.updated} updated)`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to run ${scraperName} scraper: ${message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
