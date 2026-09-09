import { Router } from "express";
import { getJob, getJobs } from "../controllers/jobs.controller.js";

export const jobsRouter = Router();

jobsRouter.get("/", getJobs);
jobsRouter.get("/:id", getJob);
