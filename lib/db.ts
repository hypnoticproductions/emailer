// lib/db.ts - Configured for Supabase
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

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL must be set. Get it from Supabase: Settings -> Database -> Connection String (Session pooling)'
    );
  }

  // Create pool if it doesn't exist
  if (!globalThis.pool) {
    globalThis.pool = new Pool({
      connectionString,
      // Supabase handles SSL automatically - no configuration needed!
      max: 20,
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
