import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { companiesRouter } from "./routes/companies.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { jobsRouter } from "./routes/jobs.routes.js";
import { scrapeRunsRouter } from "./routes/scrapeRuns.routes.js";
import { prisma } from "./prisma/client.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/jobs", jobsRouter);
app.use("/scrape-runs", scrapeRunsRouter);
app.use("/companies", companiesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ error: message });
});

const server = app.listen(port, () => {
  console.log(`SwissScope backend listening on http://localhost:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
