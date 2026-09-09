import type { Request, Response } from "express";
import { listCompanies } from "../services/company.service.js";

export async function getCompanies(_req: Request, res: Response) {
  const companies = await listCompanies();

  return res.json({
    count: companies.length,
    companies: companies.map((company) => ({
      id: company.id,
      name: company.name,
      jobCount: company._count.jobs,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    })),
  });
}
