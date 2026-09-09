import { prisma } from "../prisma/client.js";
import { cleanText } from "../utils/normalizeData.js";

export async function findOrCreateCompany(name: string) {
  const normalizedName = normalizeCompanyName(name);

  return prisma.company.upsert({
    where: { name: normalizedName },
    update: {},
    create: { name: normalizedName },
  });
}

function normalizeCompanyName(name: string): string {
  return cleanText(name);
}
