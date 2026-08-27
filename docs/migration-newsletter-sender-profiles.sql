CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS newsletter_sender_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT 'none',
  from_email TEXT NOT NULL,
  sender_name TEXT,
  api_url TEXT,
  api_key_encrypted TEXT,
  api_key_last4 TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_sender_profiles_is_default ON newsletter_sender_profiles(is_default);
CREATE INDEX IF NOT EXISTS idx_newsletter_sender_profiles_service ON newsletter_sender_profiles(service);

ALTER TABLE newsletter_sender_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage newsletter_sender_profiles" ON newsletter_sender_profiles;
DROP POLICY IF EXISTS "Deny client access newsletter_sender_profiles" ON newsletter_sender_profiles;
CREATE POLICY "Deny client access newsletter_sender_profiles" ON newsletter_sender_profiles
  FOR ALL
  USING (false)
  WITH CHECK (false);

DROP TRIGGER IF EXISTS update_newsletter_sender_profiles_updated_at ON newsletter_sender_profiles;
CREATE TRIGGER update_newsletter_sender_profiles_updated_at
  BEFORE UPDATE ON newsletter_sender_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE newsletter_campaigns
  ADD COLUMN IF NOT EXISTS sender_profile_id UUID REFERENCES newsletter_sender_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sender_profile_id ON newsletter_campaigns(sender_profile_id);
