import { runScheduledScrape } from "./runScheduledScrape.js";

const outcome = await runScheduledScrape({ disconnect: true });

if (outcome.status === "FAILED") {
  process.exitCode = 1;
}
