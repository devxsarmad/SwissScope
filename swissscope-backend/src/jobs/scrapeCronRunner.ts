import "dotenv/config";
import { prisma } from "../prisma/client.js";
import { runScheduledScrape } from "./runScheduledScrape.js";

const intervalHours = parsePositiveNumber(process.env.SCRAPE_CRON_INTERVAL_HOURS) ?? 3;
const intervalMs = intervalHours * 60 * 60 * 1000;
const runOnStart = process.env.SCRAPE_CRON_RUN_ON_START !== "false";
let isRunning = false;

console.log(`SwissScope scrape scheduler started. Running every ${intervalHours} hour(s).`);

if (runOnStart) {
  void triggerScheduledScrape("startup");
}

const timer = setInterval(() => {
  void triggerScheduledScrape("interval");
}, intervalMs);

async function triggerScheduledScrape(reason: "startup" | "interval") {
  if (isRunning) {
    console.warn(`Skipping ${reason} scrape because a previous scrape is still running.`);
    return;
  }

  isRunning = true;
  console.log(`Starting ${reason} scrape at ${new Date().toISOString()}`);

  try {
    const outcome = await runScheduledScrape({ disconnect: false });
    console.log(`Completed ${reason} scrape ${outcome.id} with status ${outcome.status}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unhandled ${reason} scrape error: ${message}`);
  } finally {
    isRunning = false;
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    clearInterval(timer);
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

function parsePositiveNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
