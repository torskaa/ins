import { PrismaClient } from "@/generated/prisma/client"
import { PrismaSqlite } from "prisma-adapter-sqlite"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter: new PrismaSqlite({
      url: process.env.DATABASE_URL || "file:./dev.db",
    }),
  } as any)
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
