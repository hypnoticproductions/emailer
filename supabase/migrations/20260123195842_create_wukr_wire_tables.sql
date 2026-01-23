/*
  # Create WUKR Wire Database Schema

  This migration creates the complete database schema for the WUKR Wire intelligence distribution system.

  ## New Tables

  ### contacts
  Stores the 108 contacts with sector segmentation for targeted distribution
  - `id` (text, primary key)
  - `email` (text, unique, required)
  - `first_name` (text)
  - `last_name` (text)
  - `company` (text)
  - `title` (text)
  - `sector` (text, required) - fintech, clean_energy, tech_web3, tourism, agriculture, music_creative, government, other
  - `linkedin` (text)
  - `notes` (text)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

  ### newsletters
  Stores signal data and newsletter content from MANUS
  - `id` (text, primary key)
  - `title` (text, required)
  - `content` (text, required)
  - `signal` (jsonb) - Morphic signal data structure
  - `metadata` (jsonb) - Additional metadata (content type, file name, etc.)
  - `sent_at` (timestamp)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

  ### emails_sent
  Tracks individual emails sent to contacts with engagement metrics
  - `id` (text, primary key)
  - `contact_id` (text, foreign key to contacts)
  - `newsletter_id` (text, foreign key to newsletters)
  - `subject` (text, required)
  - `html_content` (text, required)
  - `text_content` (text)
  - `resend_id` (text, unique) - Resend email ID for tracking
  - `status` (text) - pending, sent, delivered, failed
  - `sent_at` (timestamp)
  - `delivered_at` (timestamp)
  - `opened_at` (timestamp)
  - `clicked_at` (timestamp)
  - `replied_at` (timestamp)
  - `sector` (text, required)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated access (service role will bypass RLS)

  ## Indexes
  - Optimize queries by sector, email, status, and resend_id
*/

-- Create contacts table
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

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_sector ON contacts(sector);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Create newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  signal JSONB,
  metadata JSONB,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create emails_sent table
CREATE TABLE IF NOT EXISTS emails_sent (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  newsletter_id TEXT NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
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

-- Create indexes for emails_sent
CREATE INDEX IF NOT EXISTS idx_emails_sent_contact_id ON emails_sent(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_newsletter_id ON emails_sent(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_sector ON emails_sent(sector);
CREATE INDEX IF NOT EXISTS idx_emails_sent_resend_id ON emails_sent(resend_id);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (these are permissive since service role bypasses RLS anyway)
CREATE POLICY "Service role can manage contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage newsletters"
  ON newsletters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage emails_sent"
  ON emails_sent
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);