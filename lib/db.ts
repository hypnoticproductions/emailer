// lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var pool: Pool | undefined;
}

// Lazy initialization - only create client when actually needed
function getPrismaClient(): PrismaClient {
  if (globalThis.prisma) {
    return globalThis.prisma;
  }

  // Use POSTGRES_PRISMA_URL first (optimized for Prisma), fall back to DATABASE_URL
  // For Vercel Postgres, POSTGRES_PRISMA_URL is the connection pooling URL
  let connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL or POSTGRES_PRISMA_URL must be set. Please add it to your environment variables.'
    );
  }

  // Ensure SSL mode is set for Vercel Postgres
  if (!connectionString.includes('sslmode=')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString = `${connectionString}${separator}sslmode=require`;
  }

  // Create pool if it doesn't exist
  if (!globalThis.pool) {
    globalThis.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Accept Vercel's SSL certificates
      },
      // Additional connection options for better reliability
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  const adapter = new PrismaPg(globalThis.pool);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = client;
  }

  return client;
}

// Export a proxy that lazily initializes the client
export const db = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
