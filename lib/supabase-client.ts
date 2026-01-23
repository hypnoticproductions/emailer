import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

class SupabaseConnection {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig | null = null;
  private validated: boolean = false;

  private validateConfig(): SupabaseConfig {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
    }

    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    if (!serviceRoleKey.startsWith('eyJ')) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY appears to be invalid. ' +
        'It should be a JWT token starting with "eyJ" (200+ characters). ' +
        'Get the correct key from: Supabase Dashboard → Settings → API → service_role key'
      );
    }

    if (serviceRoleKey.length < 100) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY appears to be incomplete. ' +
        'The service role key should be 200+ characters long.'
      );
    }

    try {
      new URL(url);
    } catch {
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${url}`);
    }

    return { url, serviceRoleKey };
  }

  getClient(): SupabaseClient {
    if (this.client && this.validated) {
      return this.client;
    }

    if (!this.config) {
      this.config = this.validateConfig();
      this.validated = true;
    }

    if (!this.client) {
      console.log('[supabase] Creating new client connection');
      this.client = createClient(this.config.url, this.config.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log('[supabase] Client created successfully');
    }

    return this.client;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();
      const { error } = await client.from('contacts').select('id').limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  reset(): void {
    this.client = null;
    this.config = null;
    this.validated = false;
    console.log('[supabase] Connection reset');
  }
}

export const supabaseConnection = new SupabaseConnection();

export function getSupabaseClient(): SupabaseClient {
  return supabaseConnection.getClient();
}

export async function validateSupabaseConnection(): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const result = await supabaseConnection.testConnection();
    return { valid: result.success, error: result.error };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate connection',
    };
  }
}
