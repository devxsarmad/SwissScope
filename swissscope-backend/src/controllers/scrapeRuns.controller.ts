import type { Request, Response } from "express";
import { getLatestScrapeRun } from "../services/scrapeRun.service.js";

export async function getLatestScrapeRunController(_req: Request, res: Response) {
  const scrapeRun = await getLatestScrapeRun();
  return res.json({ scrapeRun });
}
