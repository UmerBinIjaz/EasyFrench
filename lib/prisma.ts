import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  if (!globalForPrisma.pool) {
    const url = process.env.DATABASE_URL || "";

    // The pg driver treats sslmode=require as verify-full (secure but strict).
    // The PrismaPg adapter wraps the pool but can strip SSL settings from the
    // connection string when passing through to the underlying pg Pool queries.
    // We work around this by keeping sslmode in the connection string AND
    // explicitly passing ssl config so the pool itself uses it on connect.
    globalForPrisma.pool = new Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 30000,
      // Explicit SSL config ensures the adapter's internal queries also use SSL.
      // Without this, PrismaPg may drop the SSL parameters on pooled connections.
      ssl: { rejectUnauthorized: false },
    });
  }

  globalForPrisma.pool.on("error", (err) => {
    console.error("Database pool error:", err.message, err.stack);
  });

  const adapter = new PrismaPg(globalForPrisma.pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
