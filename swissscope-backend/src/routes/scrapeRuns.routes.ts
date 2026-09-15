import { Router } from "express";
import { getLatestScrapeRunController, getScrapeRunsController } from "../controllers/scrapeRuns.controller.js";

export const scrapeRunsRouter = Router();

scrapeRunsRouter.get("/", getScrapeRunsController);
scrapeRunsRouter.get("/latest", getLatestScrapeRunController);
