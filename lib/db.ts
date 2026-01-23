import { getSupabaseClient, validateSupabaseConnection } from './supabase-client';
import { database } from './database-operations';

export async function checkDatabaseHealth() {
  try {
    const connectionCheck = await validateSupabaseConnection();

    if (!connectionCheck.valid) {
      return {
        healthy: false,
        error: connectionCheck.error,
        message: 'Database connection failed',
      };
    }

    const supabase = getSupabaseClient();
    const tables = ['contacts', 'newsletters', 'emails_sent'];
    const results = [];

    for (const table of tables) {
      try {
        const { error, count } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true })
          .limit(1);

        results.push({
          table,
          exists: !error || error.code !== '42P01',
          rowCount: count || 0,
          error: error ? error.message : null,
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
