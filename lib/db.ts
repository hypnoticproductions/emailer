import { getSQLiteClient } from './sqlite-client';
import { database } from './database-operations';

export async function checkDatabaseHealth() {
  try {
    const db = getSQLiteClient();
    const tables = ['contacts', 'newsletters', 'emails_sent'];
    const results = [];

    for (const table of tables) {
      try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
        results.push({
          table,
          exists: true,
          rowCount: result.count,
          error: null,
        });
      } catch (err) {
        results.push({
          table,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const allTablesExist = results.every(r => r.exists);

    return {
      healthy: allTablesExist,
      tables: results,
      message: allTablesExist
        ? 'All database tables are ready'
        : 'Some tables are missing or inaccessible',
    };
  } catch (error) {
    console.error('[db] Health check error:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database health check failed',
    };
  }
}

export const db = database;
