-- Migration: Create email_service_settings table for server-side newsletter sending
-- Stores provider configuration and is not publicly readable.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS email_service_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service TEXT NOT NULL DEFAULT 'none',
  api_key_encrypted TEXT,
  api_key_last4 TEXT,
  api_url TEXT,
  from_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_service_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage email_service_settings" ON email_service_settings;
CREATE POLICY "Authenticated manage email_service_settings" ON email_service_settings
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_email_service_settings_updated_at ON email_service_settings;
CREATE TRIGGER update_email_service_settings_updated_at
  BEFORE UPDATE ON email_service_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
