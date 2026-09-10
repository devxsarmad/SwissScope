import { prisma } from "../prisma/client.js";
import { saveJobs } from "../services/job.service.js";
import { getScraper, scrapers } from "../scrapers/index.js";

const scraperName = process.argv[2] || "swissdevjobs";
const shouldSave = process.argv.includes("--save");
const scraperNames = scraperName === "all" ? Object.keys(scrapers) : [scraperName];

try {
  let totalFetched = 0;

  for (const name of scraperNames) {
    const scraper = getScraper(name);
    const jobs = await scraper.scrape();
    totalFetched += jobs.length;

    console.log(`Fetched ${jobs.length} relevant jobs from ${scraper.source}`);
    for (const job of jobs) {
      console.log(`- ${job.title} | ${job.company} | ${job.location || "Unknown location"} | ${job.url}`);
      if (job.techStack.length > 0) {
        console.log(`  Tech: ${job.techStack.join(", ")}`);
      }
      if (job.workload) {
        console.log(`  Workload: ${job.workload}`);
      }
      if (job.postedAt) {
        console.log(`  Posted: ${job.postedAt}`);
      }
      if (job.applicantCount !== null) {
        console.log(`  Applicants: ${job.applicantCount}`);
      }
    }

    if (shouldSave && jobs.length > 0) {
      const result = await saveJobs(jobs);
      console.log(`Saved ${result.total} jobs to PostgreSQL (${result.created} created, ${result.updated} updated)`);
    }
  }

  if (totalFetched === 0) {
    console.log("No jobs matched the current SwissScope target profile.");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to run ${scraperName} scraper: ${message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
