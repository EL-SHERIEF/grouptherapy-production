-- Promo submissions tables + unified admin inbox view
--
-- Apply this in Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Promote Release submissions
CREATE TABLE IF NOT EXISTS promote_release_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_name TEXT NOT NULL,
  instagram TEXT,
  track_title TEXT NOT NULL,
  track_link TEXT,
  release_date DATE,
  describe_track TEXT,
  monthly_listeners INTEGER,
  promo_content TEXT,
  promotion_goal TEXT,
  budget TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promote Event submissions
CREATE TABLE IF NOT EXISTS promote_event_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_date DATE,
  event_location TEXT,
  event_type TEXT,
  tell_us_more TEXT,
  expected_attendance INTEGER,
  ticketing_link TEXT,
  promo_content TEXT,
  instagram_or_website_link TEXT,
  what_do_you_need_from_us TEXT,
  budget TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE promote_release_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promote_event_submissions ENABLE ROW LEVEL SECURITY;

-- Public inserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promote_release_submissions' AND policyname = 'Public can submit promote release'
  ) THEN
    CREATE POLICY "Public can submit promote release" ON promote_release_submissions FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promote_event_submissions' AND policyname = 'Public can submit promote event'
  ) THEN
    CREATE POLICY "Public can submit promote event" ON promote_event_submissions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Admin reads/updates (authenticated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promote_release_submissions' AND policyname = 'Authenticated can read promote release'
  ) THEN
    CREATE POLICY "Authenticated can read promote release" ON promote_release_submissions FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promote_release_submissions' AND policyname = 'Authenticated can update promote release'
  ) THEN
    CREATE POLICY "Authenticated can update promote release" ON promote_release_submissions FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promote_release_submissions' AND policyname = 'Authenticated can delete promote release'
  ) THEN
    CREATE POLICY "Authenticated can delete promote release" ON promote_release_submissions FOR DELETE USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promote_event_submissions' AND policyname = 'Authenticated can read promote event'
  ) THEN
    CREATE POLICY "Authenticated can read promote event" ON promote_event_submissions FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promote_event_submissions' AND policyname = 'Authenticated can update promote event'
  ) THEN
    CREATE POLICY "Authenticated can update promote event" ON promote_event_submissions FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promote_event_submissions' AND policyname = 'Authenticated can delete promote event'
  ) THEN
    CREATE POLICY "Authenticated can delete promote event" ON promote_event_submissions FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Optional: ensure contacts are readable/updatable by authenticated admins
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contacts' AND policyname = 'Authenticated can read contacts'
    ) THEN
      CREATE POLICY "Authenticated can read contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contacts' AND policyname = 'Authenticated can update contacts'
    ) THEN
      CREATE POLICY "Authenticated can update contacts" ON contacts FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contacts' AND policyname = 'Authenticated can delete contacts'
    ) THEN
      CREATE POLICY "Authenticated can delete contacts" ON contacts FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
  END IF;
END $$;

-- Unified inbox view for admin UI
CREATE OR REPLACE VIEW admin_messages AS
SELECT
  c.id,
  'contacts'::text AS source_table,
  COALESCE(c.category, 'general') AS category,
  COALESCE(c.status, 'new') AS status,
  c.created_at,
  c.name,
  c.email,
  COALESCE(c.subject, 'Message') AS subject,
  c.message,
  jsonb_build_object(
    'subject', c.subject,
    'message', c.message,
    'attachmentUrl', c.attachment_url
  ) AS payload
FROM contacts c

UNION ALL

SELECT
  pr.id,
  'promote_release_submissions'::text AS source_table,
  'promote_release'::text AS category,
  COALESCE(pr.status, 'new') AS status,
  pr.created_at,
  pr.artist_name AS name,
  pr.email,
  ('Track Promo: ' || pr.artist_name || ' — ' || pr.track_title) AS subject,
  COALESCE(pr.describe_track, '') AS message,
  jsonb_build_object(
    'artistName', pr.artist_name,
    'instagram', pr.instagram,
    'trackTitle', pr.track_title,
    'trackLink', pr.track_link,
    'releaseDate', pr.release_date,
    'describeTrack', pr.describe_track,
    'monthlyListeners', pr.monthly_listeners,
    'promoContent', pr.promo_content,
    'promotionGoal', pr.promotion_goal,
    'budget', pr.budget,
    'email', pr.email
  ) AS payload
FROM promote_release_submissions pr

UNION ALL

SELECT
  pe.id,
  'promote_event_submissions'::text AS source_table,
  'promote_event'::text AS category,
  COALESCE(pe.status, 'new') AS status,
  pe.created_at,
  pe.event_name AS name,
  pe.email,
  ('Event Promo: ' || pe.event_name || COALESCE(' — ' || pe.event_date::text, '')) AS subject,
  COALESCE(pe.tell_us_more, '') AS message,
  jsonb_build_object(
    'eventName', pe.event_name,
    'eventDate', pe.event_date,
    'eventLocation', pe.event_location,
    'eventType', pe.event_type,
    'tellUsMoreAboutYourEvent', pe.tell_us_more,
    'expectedAttendance', pe.expected_attendance,
    'ticketingLink', pe.ticketing_link,
    'promoContent', pe.promo_content,
    'instagramOrWebsiteLink', pe.instagram_or_website_link,
    'whatDoYouNeedFromUs', pe.what_do_you_need_from_us,
    'budget', pe.budget,
    'email', pe.email
  ) AS payload
FROM promote_event_submissions pe;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promote_release_created_at ON promote_release_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promote_release_status ON promote_release_submissions(status);
CREATE INDEX IF NOT EXISTS idx_promote_event_created_at ON promote_event_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promote_event_status ON promote_event_submissions(status);
