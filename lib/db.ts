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

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL or POSTGRES_PRISMA_URL must be set. Please add it to your environment variables.'
    );
  }

  // Create pool if it doesn't exist
  if (!globalThis.pool) {
    globalThis.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Accept self-signed certificates from Vercel Postgres
      },
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
