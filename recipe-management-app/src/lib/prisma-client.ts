import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

export async function prismaWithRetry<T>(
  operation: (client: PrismaClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation(prisma);
    } catch (error) {
      console.error(
        `Prisma operation failed (attempt ${i + 1}/${maxRetries}):`,
        error
      );
      lastError = error;
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, i))
      ); // Exponential backoff
    }
  }
  throw lastError;
}
