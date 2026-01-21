// lib/db.ts - Supabase client connection
import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line no-var
  var supabase: SupabaseClient | undefined;
}

// Create Supabase client
function getSupabaseClient(): SupabaseClient {
  if (globalThis.supabase) {
    return globalThis.supabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  globalThis.supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return globalThis.supabase;
}

export const supabase = getSupabaseClient();

// Database initialization - create tables if they don't exist
export async function initializeDatabase() {
  try {
    // Create Contact table
    const { error: contactsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          first_name TEXT,
          last_name TEXT,
          company TEXT,
          title TEXT,
          sector TEXT NOT NULL,
          linkedin TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_contacts_sector ON contacts(sector);
        CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
      `
    });

    // If RPC doesn't exist, try direct SQL execution
    if (contactsError?.message?.includes('function') || contactsError?.code === '42883') {
      // Tables need to be created via SQL editor in Supabase dashboard
      // For now, we'll use the REST API to check if tables exist
      const { data: contacts, error: checkError } = await supabase
        .from('contacts')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === '42P01') {
        // Table doesn't exist - need to create via SQL
        throw new Error(
          'Tables not found. Please run the following SQL in your Supabase SQL Editor:\n\n' +
          `CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  title TEXT,
  sector TEXT NOT NULL,
  linkedin TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_sector ON contacts(sector);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

CREATE TABLE IF NOT EXISTS newsletters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  signal JSONB,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emails_sent (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  newsletter_id TEXT NOT NULL REFERENCES newsletters(id),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  resend_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  replied_at TIMESTAMP,
  sector TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emails_sent_contact_id ON emails_sent(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_newsletter_id ON emails_sent(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_sector ON emails_sent(sector);
CREATE INDEX IF NOT EXISTS idx_emails_sent_resend_id ON emails_sent(resend_id);`
        );
      }

      console.log('✅ Database tables verified');
      return { success: true, message: 'Tables already exist or were verified' };
    }

    console.log('✅ Database tables initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Helper functions for database operations
export const db = {
  // Contacts
  async getContacts(sectors?: string[]) {
    let query = supabase.from('contacts').select('*');

    if (sectors && sectors.length > 0) {
      query = query.in('sector', sectors);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async countContacts() {
    const { count, error } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async getContactsBySector() {
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
