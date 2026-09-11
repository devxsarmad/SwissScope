import type { Request, Response } from "express";
import { getJobById, listJobs, updateJobOutreach, updateJobStatus } from "../services/job.service.js";
import { parseJobStatus } from "../services/jobStatus.service.js";
import { parseJobOutreachUpdate } from "../services/jobOutreach.service.js";

export async function getJobs(req: Request, res: Response) {
  const minScore = parseMinScore(req.query.minScore);
  if (minScore instanceof Error) {
    return res.status(400).json({ error: minScore.message });
  }

  const status = req.query.status === undefined ? undefined : parseJobStatus(req.query.status);
  if (status instanceof Error) {
    return res.status(400).json({ error: status.message });
  }

  const jobs = await listJobs({
    city: stringQuery(req.query.city),
    company: stringQuery(req.query.company),
    minScore,
    status,
  });

  return res.json({
    count: jobs.length,
    jobs,
  });
}

export async function patchJobStatus(req: Request, res: Response) {
  const id = stringQuery(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Job id is required" });
  }

  const status = parseJobStatus(req.body?.status);
  if (status instanceof Error) {
    return res.status(400).json({ error: status.message });
  }

  try {
    const job = await updateJobStatus(id, status);
    return res.json(job);
  } catch {
    return res.status(404).json({ error: "Job not found" });
  }
}

export async function patchJobOutreach(req: Request, res: Response) {
  const id = stringQuery(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Job id is required" });
  }

  const update = parseJobOutreachUpdate(req.body);
  if (update instanceof Error) {
    return res.status(400).json({ error: update.message });
  }

  try {
    const job = await updateJobOutreach(id, update);
    return res.json(job);
  } catch {
    return res.status(404).json({ error: "Job not found" });
  }
}

export async function getJob(req: Request, res: Response) {
  const id = stringQuery(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Job id is required" });
  }

  const job = await getJobById(id);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  return res.json(job);
}

function stringQuery(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseMinScore(value: unknown): number | undefined | Error {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") return new Error("minScore must be a number from 0 to 100.");

  const score = Number(value);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return new Error("minScore must be a number from 0 to 100.");
  }

  return score;
}
