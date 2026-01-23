import { getSQLiteClient } from './sqlite-client';

export const database = {
  countContacts(): number {
    const db = getSQLiteClient();
    const result = db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number };
    return result.count;
  },

  getContactsBySector(): Array<{ sector: string; count: number }> {
    const db = getSQLiteClient();
    const results = db.prepare(`
      SELECT sector, COUNT(*) as count
      FROM contacts
      GROUP BY sector
      ORDER BY count DESC
    `).all() as Array<{ sector: string; count: number }>;

    return results;
  },

  getContacts(sectors?: string[]): any[] {
    const db = getSQLiteClient();

    if (sectors && sectors.length > 0) {
      const placeholders = sectors.map(() => '?').join(',');
      const results = db.prepare(`
        SELECT * FROM contacts
        WHERE sector IN (${placeholders})
        ORDER BY created_at DESC
      `).all(...sectors);
      return results;
    }

    const results = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
    return results;
  },

  addContact(contact: any): any {
    const db = getSQLiteClient();
    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO contacts (id, email, first_name, last_name, company, title, sector, linkedin, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      contact.email,
      contact.firstName || null,
      contact.lastName || null,
      contact.company || null,
      contact.title || null,
      contact.sector || 'other',
      contact.linkedin || null,
      contact.notes || null
    );

    const result = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    return result;
  },

  deleteContact(contactId: string): void {
    const db = getSQLiteClient();
    db.prepare('DELETE FROM contacts WHERE id = ?').run(contactId);
  },

  createNewsletter(title: string, content: string, signal: any): any {
    const db = getSQLiteClient();
    const id = `newsletter_${Date.now()}`;

    const stmt = db.prepare(`
      INSERT INTO newsletters (id, title, content, signal)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, title, content, JSON.stringify(signal));

    const result = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(id);
    if (result && typeof result === 'object' && 'signal' in result) {
      try {
        (result as any).signal = JSON.parse((result as any).signal);
      } catch {
        (result as any).signal = null;
      }
    }
    return result;
  },

  getRecentNewsletters(limit: number = 5): any[] {
    const db = getSQLiteClient();
    const results = db.prepare(`
      SELECT * FROM newsletters
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);

    return results.map((row: any) => {
      if (row.signal) {
        try {
          row.signal = JSON.parse(row.signal);
        } catch {
          row.signal = null;
        }
      }
      if (row.metadata) {
        try {
          row.metadata = JSON.parse(row.metadata);
        } catch {
          row.metadata = null;
        }
      }
      return row;
    });
  },

  createEmailSent(emailData: any): any {
    const db = getSQLiteClient();
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO emails_sent (
        id, contact_id, newsletter_id, subject, html_content, text_content,
        resend_id, status, sector, sent_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      id,
      emailData.contactId,
      emailData.newsletterId,
      emailData.subject,
      emailData.htmlContent,
      emailData.textContent || '',
      emailData.resendId,
      emailData.status || 'pending',
      emailData.sector
    );

    const result = db.prepare('SELECT * FROM emails_sent WHERE id = ?').get(id);
    return result;
  },

  getEmailStats(): {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
    bySector: Array<{ sector: string; count: number }>;
    opened: number;
    clicked: number;
  } {
    const db = getSQLiteClient();

    const totalResult = db.prepare('SELECT COUNT(*) as count FROM emails_sent').get() as { count: number };
    const total = totalResult.count;

    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM emails_sent
      GROUP BY status
      ORDER BY count DESC
    `).all() as Array<{ status: string; count: number }>;

    const bySector = db.prepare(`
      SELECT sector, COUNT(*) as count
      FROM emails_sent
      GROUP BY sector
      ORDER BY count DESC
    `).all() as Array<{ sector: string; count: number }>;

    const openedResult = db.prepare(
      'SELECT COUNT(*) as count FROM emails_sent WHERE opened_at IS NOT NULL'
    ).get() as { count: number };

    const clickedResult = db.prepare(
      'SELECT COUNT(*) as count FROM emails_sent WHERE clicked_at IS NOT NULL'
    ).get() as { count: number };

    return {
      total,
      byStatus,
      bySector,
      opened: openedResult.count,
      clicked: clickedResult.count,
    };
  },

  updateEmailStatus(resendId: string, updates: any): any {
    const db = getSQLiteClient();

    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      values.push(updates.status);
    }
    if (updates.delivered_at !== undefined) {
      setClauses.push('delivered_at = ?');
      values.push(updates.delivered_at);
    }
    if (updates.opened_at !== undefined) {
      setClauses.push('opened_at = ?');
      values.push(updates.opened_at);
    }
    if (updates.clicked_at !== undefined) {
      setClauses.push('clicked_at = ?');
      values.push(updates.clicked_at);
    }
    if (updates.replied_at !== undefined) {
      setClauses.push('replied_at = ?');
      values.push(updates.replied_at);
    }

    if (setClauses.length === 0) {
      return null;
    }

    values.push(resendId);

    const stmt = db.prepare(`
      UPDATE emails_sent
      SET ${setClauses.join(', ')}
      WHERE resend_id = ?
    `);

    stmt.run(...values);

    const result = db.prepare('SELECT * FROM emails_sent WHERE resend_id = ?').get(resendId);
    return result;
  },

  getFailedEmails(): any[] {
    const db = getSQLiteClient();
    const results = db.prepare(`
      SELECT * FROM emails_sent
      WHERE status = 'failed'
      ORDER BY created_at DESC
    `).all();
    return results;
  },
};
