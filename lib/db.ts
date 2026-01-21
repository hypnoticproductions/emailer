// lib/db.ts - Direct PostgreSQL connection (no Prisma!)
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var pool: Pool | undefined;
}

// Create connection pool
function getPool(): Pool {
  if (globalThis.pool) {
    return globalThis.pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL must be set');
  }

  globalThis.pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return globalThis.pool;
}

export const pool = getPool();

// Database initialization - create tables if they don't exist
export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Create Contact table
    await client.query(`
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
    `);

    // Create Newsletter table
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletters (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        signal JSONB,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create EmailSent table
    await client.query(`
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
      CREATE INDEX IF NOT EXISTS idx_emails_sent_resend_id ON emails_sent(resend_id);
    `);

    console.log('✅ Database tables initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper functions for database operations
export const db = {
  // Contacts
  async getContacts(sectors?: string[]) {
    const client = await pool.connect();
    try {
      if (sectors && sectors.length > 0) {
        const result = await client.query(
          'SELECT * FROM contacts WHERE sector = ANY($1)',
          [sectors]
        );
        return result.rows;
      }
      const result = await client.query('SELECT * FROM contacts');
      return result.rows;
    } finally {
      client.release();
    }
  },

  async countContacts() {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM contacts');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  },

  async getContactsBySector() {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT sector, COUNT(*) as count FROM contacts GROUP BY sector'
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  // Newsletters
  async createNewsletter(title: string, content: string, signal: any) {
    const client = await pool.connect();
    try {
      const id = `newsletter_${Date.now()}`;
      await client.query(
        'INSERT INTO newsletters (id, title, content, signal) VALUES ($1, $2, $3, $4)',
        [id, title, content, JSON.stringify(signal)]
      );
      return { id, title, content, signal };
    } finally {
      client.release();
    }
  },

  async getRecentNewsletters(limit: number = 5) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM newsletters ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  // Email tracking
  async createEmailSent(data: any) {
    const client = await pool.connect();
    try {
      const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await client.query(
        `INSERT INTO emails_sent
        (id, contact_id, newsletter_id, subject, html_content, text_content, resend_id, status, sector, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [id, data.contactId, data.newsletterId, data.subject, data.htmlContent,
         data.textContent || '', data.resendId, data.status, data.sector]
      );
      return { id, ...data };
    } finally {
      client.release();
    }
  },

  async getEmailStats() {
    const client = await pool.connect();
    try {
      const total = await client.query('SELECT COUNT(*) FROM emails_sent');
      const byStatus = await client.query(
        'SELECT status, COUNT(*) as count FROM emails_sent GROUP BY status'
      );
      const bySector = await client.query(
        'SELECT sector, COUNT(*) as count FROM emails_sent GROUP BY sector'
      );
      const opened = await client.query(
        'SELECT COUNT(*) FROM emails_sent WHERE opened_at IS NOT NULL'
      );
      const clicked = await client.query(
        'SELECT COUNT(*) FROM emails_sent WHERE clicked_at IS NOT NULL'
      );

      return {
        total: parseInt(total.rows[0].count),
        byStatus: byStatus.rows,
        bySector: bySector.rows,
        opened: parseInt(opened.rows[0].count),
        clicked: parseInt(clicked.rows[0].count),
      };
    } finally {
      client.release();
    }
  },
};
