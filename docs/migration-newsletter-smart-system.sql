CREATE TABLE IF NOT EXISTS newsletter_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE newsletter_states
ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#64748b';

CREATE OR REPLACE FUNCTION newsletter_state_slugify(input TEXT)
RETURNS TEXT AS $$
DECLARE
  s TEXT;
BEGIN
  s := lower(coalesce(input, ''));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+)|(-+$)', '', 'g');
  IF s = '' THEN
    s := 'state';
  END IF;
  RETURN s;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION newsletter_states_before_insert_set_key()
RETURNS TRIGGER AS $$
DECLARE
  base_key TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  IF NEW.key IS NULL OR length(trim(NEW.key)) = 0 THEN
    base_key := newsletter_state_slugify(NEW.name);
    candidate := base_key;
    suffix := 0;

    WHILE EXISTS (SELECT 1 FROM newsletter_states WHERE key = candidate) LOOP
      suffix := suffix + 1;
      candidate := base_key || '-' || suffix::text;
    END LOOP;

    NEW.key := candidate;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_newsletter_states_set_key ON newsletter_states;
CREATE TRIGGER trg_newsletter_states_set_key
  BEFORE INSERT ON newsletter_states
  FOR EACH ROW
  EXECUTE FUNCTION newsletter_states_before_insert_set_key();

ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES newsletter_states(id) ON DELETE SET NULL;

ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS opted_out BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMPTZ;

ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_state_id ON newsletter_subscribers(state_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_opted_out ON newsletter_subscribers(opted_out);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_tags_gin ON newsletter_subscribers USING GIN (tags);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_newsletter_states_updated_at ON newsletter_states;
CREATE TRIGGER update_newsletter_states_updated_at
  BEFORE UPDATE ON newsletter_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO newsletter_states (key, name)
VALUES ('default', 'default')
ON CONFLICT (key) DO NOTHING;

UPDATE newsletter_states
SET color = COALESCE(color, '#64748b')
WHERE color IS NULL;

ALTER TABLE newsletter_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin read newsletter states" ON newsletter_states;
CREATE POLICY "Admin read newsletter states" ON newsletter_states FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admin manage newsletter states" ON newsletter_states;
CREATE POLICY "Admin manage newsletter states" ON newsletter_states FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION newsletter_upsert_subscriber(
  _email TEXT,
  _name TEXT,
  _source TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_state UUID;
BEGIN
  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    RETURN;
  END IF;

  SELECT id INTO default_state FROM newsletter_states WHERE key = 'default' LIMIT 1;

  INSERT INTO newsletter_subscribers (email, name, source, active, subscribed_at, unsubscribed_at, opted_out, opted_out_at, state_id)
  VALUES (lower(_email), NULLIF(_name, ''), _source, true, NOW(), NULL, false, NULL, default_state)
  ON CONFLICT (email) DO UPDATE
  SET
    name = COALESCE(EXCLUDED.name, newsletter_subscribers.name),
    source = COALESCE(newsletter_subscribers.source, EXCLUDED.source),
    state_id = COALESCE(newsletter_subscribers.state_id, EXCLUDED.state_id);

  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION newsletter_auto_subscribe_from_contact()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM newsletter_upsert_subscriber(NEW.email, NEW.name, 'contact');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_newsletter_auto_subscribe_contact ON contacts;
CREATE TRIGGER trigger_newsletter_auto_subscribe_contact
  AFTER INSERT OR UPDATE OF email, name ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION newsletter_auto_subscribe_from_contact();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'promote_release_submissions') THEN
    CREATE OR REPLACE FUNCTION newsletter_auto_subscribe_from_promote_release()
    RETURNS TRIGGER AS $$
    BEGIN
      PERFORM newsletter_upsert_subscriber(NEW.email, NEW.artist_name, 'message');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_newsletter_auto_subscribe_promote_release ON promote_release_submissions;
    CREATE TRIGGER trigger_newsletter_auto_subscribe_promote_release
      AFTER INSERT OR UPDATE OF email, artist_name ON promote_release_submissions
      FOR EACH ROW
      EXECUTE FUNCTION newsletter_auto_subscribe_from_promote_release();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'promote_event_submissions') THEN
    CREATE OR REPLACE FUNCTION newsletter_auto_subscribe_from_promote_event()
    RETURNS TRIGGER AS $$
    BEGIN
      PERFORM newsletter_upsert_subscriber(NEW.email, NEW.event_name, 'message');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_newsletter_auto_subscribe_promote_event ON promote_event_submissions;
    CREATE TRIGGER trigger_newsletter_auto_subscribe_promote_event
      AFTER INSERT OR UPDATE OF email, event_name ON promote_event_submissions
      FOR EACH ROW
      EXECUTE FUNCTION newsletter_auto_subscribe_from_promote_event();
  END IF;
END $$;

DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
    FOR r IN SELECT email, name FROM contacts WHERE email IS NOT NULL AND length(trim(email)) > 0 LOOP
      PERFORM newsletter_upsert_subscriber(r.email, r.name, 'contact');
    END LOOP;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'promote_release_submissions') THEN
    FOR r IN SELECT email, artist_name FROM promote_release_submissions WHERE email IS NOT NULL AND length(trim(email)) > 0 LOOP
      PERFORM newsletter_upsert_subscriber(r.email, r.artist_name, 'message');
    END LOOP;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'promote_event_submissions') THEN
    FOR r IN SELECT email, event_name FROM promote_event_submissions WHERE email IS NOT NULL AND length(trim(email)) > 0 LOOP
      PERFORM newsletter_upsert_subscriber(r.email, r.event_name, 'message');
    END LOOP;
  END IF;
END $$;
