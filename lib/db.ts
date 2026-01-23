// lib/db.ts - Supabase client connection
import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line no-var
  var supabase: SupabaseClient | undefined;
}

// Create Supabase client (lazy initialization)
function getSupabaseClient(): SupabaseClient {
  if (globalThis.supabase) {
    return globalThis.supabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
  }

  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
  }

  console.log('[db] Initializing Supabase client');
  console.log('[db] URL:', supabaseUrl);
  console.log('[db] Service key present:', supabaseKey ? 'YES' : 'NO');
  console.log('[db] Service key length:', supabaseKey.length);
  console.log('[db] Service key prefix:', supabaseKey.substring(0, 10));

  try {
    globalThis.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('[db] Supabase client created successfully');
    return globalThis.supabase;
  } catch (error) {
    console.error('[db] Failed to create Supabase client:', error);
    throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Database health check - verify tables exist
export async function checkDatabaseHealth() {
  try {
    const supabase = getSupabaseClient();

    // Check if tables exist by querying them
    const tables = ['contacts', 'newsletters', 'emails_sent'];
    const results = [];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      results.push({
        table,
        exists: !error || error.code !== '42P01',
        error: error ? error.message : null,
      });
    }

    const allTablesExist = results.every(r => r.exists);

    return {
      healthy: allTablesExist,
      tables: results,
      message: allTablesExist
        ? 'All database tables are ready'
        : 'Some tables are missing. Please run migrations.',
    };
  } catch (error) {
    console.error('❌ Database health check error:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper functions for database operations
export const db = {
  // Contacts
  async getContacts(sectors?: string[]) {
    const supabase = getSupabaseClient();
    let query = supabase.from('contacts').select('*');

    if (sectors && sectors.length > 0) {
      query = query.in('sector', sectors);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async countContacts() {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async getContactsBySector() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('contacts')
      .select('sector');

    if (error) throw error;

    // Group by sector manually
    const grouped = (data || []).reduce((acc: any, row: any) => {
      const sector = row.sector;
      if (!acc[sector]) {
        acc[sector] = { sector, count: 0 };
      }
      acc[sector].count++;
      return acc;
    }, {});

    return Object.values(grouped);
  },

  // Newsletters
  async createNewsletter(title: string, content: string, signal: any) {
    const supabase = getSupabaseClient();
    const id = `newsletter_${Date.now()}`;
    const { data, error } = await supabase
      .from('newsletters')
      .insert({
        id,
        title,
        content,
        signal,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRecentNewsletters(limit: number = 5) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Email tracking
  async createEmailSent(emailData: any) {
    const supabase = getSupabaseClient();
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data, error } = await supabase
      .from('emails_sent')
      .insert({
        id,
        contact_id: emailData.contactId,
        newsletter_id: emailData.newsletterId,
        subject: emailData.subject,
        html_content: emailData.htmlContent,
        text_content: emailData.textContent || '',
        resend_id: emailData.resendId,
        status: emailData.status,
        sector: emailData.sector,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getEmailStats() {
    const supabase = getSupabaseClient();
    // Get total count
    const { count: total } = await supabase
      .from('emails_sent')
      .select('*', { count: 'exact', head: true });

    // Get all emails for grouping
    const { data: allEmails } = await supabase
      .from('emails_sent')
      .select('status, sector, opened_at, clicked_at');

    const emails = allEmails || [];

    // Group by status
    const byStatus = emails.reduce((acc: any, email: any) => {
      const status = email.status;
      if (!acc[status]) {
        acc[status] = { status, count: 0 };
      }
      acc[status].count++;
      return acc;
    }, {});

    // Group by sector
    const bySector = emails.reduce((acc: any, email: any) => {
      const sector = email.sector;
      if (!acc[sector]) {
        acc[sector] = { sector, count: 0 };
      }
      acc[sector].count++;
      return acc;
    }, {});

    // Count opened and clicked
    const opened = emails.filter((e: any) => e.opened_at).length;
    const clicked = emails.filter((e: any) => e.clicked_at).length;

    return {
      total: total || 0,
      byStatus: Object.values(byStatus),
      bySector: Object.values(bySector),
      opened,
      clicked,
    };
  },

  async updateEmailStatus(resendId: string, updates: any) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emails_sent')
      .update(updates)
      .eq('resend_id', resendId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
