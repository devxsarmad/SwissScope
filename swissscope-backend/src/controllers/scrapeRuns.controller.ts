import type { Request, Response } from "express";
import { getLatestScrapeRun, listScrapeRuns } from "../services/scrapeRun.service.js";

export async function getLatestScrapeRunController(_req: Request, res: Response) {
  const scrapeRun = await getLatestScrapeRun();
  return res.json({ scrapeRun });
}

export async function getScrapeRunsController(req: Request, res: Response) {
  const limit = parseLimit(req.query.limit);
  if (limit instanceof Error) {
    return res.status(400).json({ error: limit.message });
  }

  const scrapeRuns = await listScrapeRuns(limit);
  return res.json({ count: scrapeRuns.length, scrapeRuns });
}

function parseLimit(value: unknown): number | undefined | Error {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") return new Error("limit must be a number from 1 to 50.");

  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return new Error("limit must be a number from 1 to 50.");
  }

  return limit;
}
