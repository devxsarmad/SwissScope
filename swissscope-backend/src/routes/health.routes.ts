import { Router } from "express";
import { prisma } from "../prisma/client.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;

  res.json({
    status: "ok",
    service: "swissscope-backend",
    checkedAt: new Date().toISOString(),
  });
});
