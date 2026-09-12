import { Router } from "express";
import { getLatestScrapeRunController } from "../controllers/scrapeRuns.controller.js";

export const scrapeRunsRouter = Router();

scrapeRunsRouter.get("/latest", getLatestScrapeRunController);
