import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const cachedClient = globalForPrisma.prisma;

const requiredDelegates = [
  "estimateRequest",
  "mediaAsset",
  "adminUser",
  "portfolioProject",
  "testimonial",
  "siteSetting",
] as const;

const needsRefresh = Boolean(
  cachedClient &&
    requiredDelegates.some((delegateName) => !(delegateName in (cachedClient as unknown as object))),
);

export const prisma = needsRefresh ? createClient() : cachedClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
