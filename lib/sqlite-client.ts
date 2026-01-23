import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

function getDatabasePath(): string {
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'wukr-wire.db');
}

function initializeDatabase(): Database.Database {
  const dbPath = getDatabasePath();
  console.log('[sqlite] Initializing database at:', dbPath);

  const database = new Database(dbPath);

  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');

  database.exec(`
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_sector ON contacts(sector);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

    CREATE TABLE IF NOT EXISTS newsletters (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      signal TEXT,
      metadata TEXT,
      sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS emails_sent (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      newsletter_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      html_content TEXT NOT NULL,
      text_content TEXT,
      resend_id TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      sent_at TEXT,
      delivered_at TEXT,
      opened_at TEXT,
      clicked_at TEXT,
      replied_at TEXT,
      sector TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (newsletter_id) REFERENCES newsletters(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_emails_sent_contact_id ON emails_sent(contact_id);
    CREATE INDEX IF NOT EXISTS idx_emails_sent_newsletter_id ON emails_sent(newsletter_id);
    CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
    CREATE INDEX IF NOT EXISTS idx_emails_sent_sector ON emails_sent(sector);
    CREATE INDEX IF NOT EXISTS idx_emails_sent_resend_id ON emails_sent(resend_id);
  `);

  console.log('[sqlite] Database initialized successfully');
  return database;
}

export function getSQLiteClient(): Database.Database {
  if (!db) {
    db = initializeDatabase();
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[sqlite] Database connection closed');
  }
}
