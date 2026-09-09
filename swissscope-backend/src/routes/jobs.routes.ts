import { Router } from "express";
import { getJob, getJobs, patchJobStatus } from "../controllers/jobs.controller.js";

export const jobsRouter = Router();

jobsRouter.get("/", getJobs);
jobsRouter.get("/:id", getJob);
jobsRouter.patch("/:id/status", patchJobStatus);
