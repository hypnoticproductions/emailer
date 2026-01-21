// lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with PostgreSQL adapter for Prisma 7
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    console.warn('No DATABASE_URL found, PrismaClient may not work correctly');
    // Return a dummy client for build time
    return new PrismaClient() as any;
  }

  const pool = new Pool({
    connectionString,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
  });
}

export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}
