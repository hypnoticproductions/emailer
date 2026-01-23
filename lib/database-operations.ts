import { getSupabaseClient } from './supabase-client';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`[db] Attempt ${attempt}/${maxAttempts} failed:`, lastError.message);

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

export const database = {
  async countContacts(): Promise<number> {
    return retryOperation(async () => {
      const supabase = getSupabaseClient();
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('[db] Count contacts error:', error);
        throw new Error(`Failed to count contacts: ${error.message}`);
      }

      return count || 0;
    });
  },

  async getContactsBySector(): Promise<Array<{ sector: string; count: number }>> {
    return retryOperation(async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('contacts').select('sector');

      if (error) {
        console.error('[db] Get contacts by sector error:', error);
        throw new Error(`Failed to get contacts by sector: ${error.message}`);
      }

      const grouped = (data || []).reduce((acc: Record<string, number>, row) => {
        const sector = row.sector || 'unknown';
        acc[sector] = (acc[sector] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped)
        .map(([sector, count]) => ({ sector, count }))
        .sort((a, b) => b.count - a.count);
    });
  },

  async getContacts(sectors?: string[]): Promise<any[]> {
    return retryOperation(async () => {
      const supabase = getSupabaseClient();
      let query = supabase.from('contacts').select('*').order('created_at', { ascending: false });

      if (sectors && sectors.length > 0) {
        query = query.in('sector', sectors);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[db] Get contacts error:', error);
        throw new Error(`Failed to get contacts: ${error.message}`);
      }

      return data || [];
    });
  },

  async addContact(contact: any): Promise<any> {
    return retryOperation(async () => {
      const supabase = getSupabaseClient();
      const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          id,
          email: contact.email,
          first_name: contact.firstName || null,
          last_name: contact.lastName || null,
          company: contact.company || null,
          title: contact.title || null,
          sector: contact.sector || 'other',
          linkedin: contact.linkedin || null,
          notes: contact.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[db] Add contact error:', error);
        throw new Error(`Failed to add contact: ${error.message}`);
      }

      return data;
    });
  },

  async deleteContact(contactId: string): Promise<void> {
    return retryOperation(async () => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('contacts').delete().eq('id', contactId);

      if (error) {
        console.error('[db] Delete contact error:', error);
        throw new Error(`Failed to delete contact: ${error.message}`);
      }
    });
  },

  async createNewsletter(title: string, content: string, signal: any): Promise<any> {
    return retryOperation(async () => {
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

      if (error) {
        console.error('[db] Create newsletter error:', error);
        throw new Error(`Failed to create newsletter: ${error.message}`);
      }

      return data;
    });
  },

  async getRecentNewsletters(limit: number = 5): Promise<any[]> {
    return retryOperation(async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[db] Get recent newsletters error:', error);
        throw new Error(`Failed to get newsletters: ${error.message}`);
      }

      return data || [];
    });
  },

  async createEmailSent(emailData: any): Promise<any> {
    return retryOperation(async () => {
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
          status: emailData.status || 'pending',
          sector: emailData.sector,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[db] Create email sent error:', error);
        throw new Error(`Failed to create email record: ${error.message}`);
      }

      return data;
    });
  },

  async getEmailStats(): Promise<{
    total: number;
    byStatus: Array<{ status: string; count: number }>;
    bySector: Array<{ sector: string; count: number }>;
    opened: number;
    clicked: number;
  }> {
    return retryOperation(async () => {
      const supabase = getSupabaseClient();

      const { count: total } = await supabase
        .from('emails_sent')
        .select('*', { count: 'exact', head: true });

      const { data: allEmails } = await supabase
        .from('emails_sent')
        .select('status, sector, opened_at, clicked_at');

      const emails = allEmails || [];

      const byStatus = emails.reduce((acc: Record<string, number>, email) => {
        const status = email.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const bySector = emails.reduce((acc: Record<string, number>, email) => {
        const sector = email.sector || 'unknown';
        acc[sector] = (acc[sector] || 0) + 1;
        return acc;
      }, {});

      const opened = emails.filter(e => e.opened_at).length;
      const clicked = emails.filter(e => e.clicked_at).length;

      return {
        total: total || 0,
        byStatus: Object.entries(byStatus)
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => b.count - a.count),
        bySector: Object.entries(bySector)
          .map(([sector, count]) => ({ sector, count }))
          .sort((a, b) => b.count - a.count),
        opened,
        clicked,
      };
    });
  },

  async updateEmailStatus(resendId: string, updates: any): Promise<any> {
    return retryOperation(async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('emails_sent')
        .update(updates)
        .eq('resend_id', resendId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('[db] Update email status error:', error);
        throw new Error(`Failed to update email status: ${error.message}`);
      }

      return data;
    });
  },

  async getFailedEmails(): Promise<any[]> {
    return retryOperation(async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('emails_sent')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[db] Get failed emails error:', error);
        throw new Error(`Failed to get failed emails: ${error.message}`);
      }

      return data || [];
    });
  },
};
