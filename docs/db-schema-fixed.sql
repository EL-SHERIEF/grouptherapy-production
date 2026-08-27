-- ============================================================================
-- GroupTherapy Music Label - Complete Supabase Database Schema
-- Version: 2.0 (Fixed and Enhanced)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  image_url TEXT,
  spotify_artist_id TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Releases table
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  artist_name TEXT NOT NULL,
  cover_url TEXT,
  release_date TIMESTAMPTZ,
  genres TEXT[],
  spotify_album_id TEXT,
  spotify_url TEXT,
  apple_music_url TEXT,
  soundcloud_url TEXT,
  preview_url TEXT,
  type TEXT DEFAULT 'single',
  featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMPTZ,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  venue TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  lat TEXT,
  lng TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  image_url TEXT,
  ticket_url TEXT,
  ticket_price TEXT,
  capacity INTEGER,
  rsvp_count INTEGER DEFAULT 0,
  artist_ids TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table (for news/blog)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_url TEXT,
  category TEXT DEFAULT 'news',
  tags TEXT[],
  author_id UUID,
  author_name TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  published_at TIMESTAMPTZ,
  published BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Radio shows table (enhanced with scheduling)
CREATE TABLE IF NOT EXISTS radio_shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  host_name TEXT NOT NULL,
  host_bio TEXT,
  host_image_url TEXT,
  cover_url TEXT,
  stream_url TEXT,
  recorded_url TEXT,
  day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc.
  start_time TEXT, -- HH:MM format
  end_time TEXT, -- HH:MM format
  timezone TEXT DEFAULT 'UTC',
  schedule_start TIMESTAMPTZ, -- Specific scheduled start time
  schedule_end TIMESTAMPTZ, -- Specific scheduled end time
  is_live BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Radio tracks table
CREATE TABLE IF NOT EXISTS radio_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  cover_url TEXT,
  duration INTEGER,
  soundcloud_url TEXT,
  played_at TIMESTAMPTZ NOT NULL,
  show_id UUID REFERENCES radio_shows(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_url TEXT,
  spotify_playlist_id TEXT,
  spotify_url TEXT,
  track_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  youtube_id TEXT,
  vimeo_id TEXT,
  artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  artist_name TEXT,
  duration TEXT,
  category TEXT DEFAULT 'music-video',
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  attachment_url TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Radio settings table
CREATE TABLE IF NOT EXISTS radio_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_name TEXT DEFAULT 'GroupTherapy Radio',
  stream_url TEXT,
  fallback_stream_url TEXT,
  current_track TEXT,
  current_artist TEXT,
  current_cover_url TEXT,
  current_show_name TEXT,
  current_host_name TEXT,
  is_live BOOLEAN DEFAULT FALSE,
  listener_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Careers table
CREATE TABLE IF NOT EXISTS careers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  salary TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career applications table
CREATE TABLE IF NOT EXISTS career_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tours table
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  artist_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour dates table
CREATE TABLE IF NOT EXISTS tour_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  ticket_url TEXT,
  ticket_price TEXT,
  sold_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Static pages table (for terms, privacy, cookies, about, etc.)
CREATE TABLE IF NOT EXISTS static_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  published BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers table (enhanced with source tracking)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'website', -- website, footer, popup, import, etc.
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  CONSTRAINT newsletter_email_unique UNIQUE (email)
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Press assets table
CREATE TABLE IF NOT EXISTS press_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'logo',
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SITE SETTINGS & SEO
-- ============================================================================

-- Site settings table (for homepage content control)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Hero Section
  hero_tag TEXT,
  hero_title TEXT DEFAULT 'GROUPTHERAPY',
  hero_subtitle TEXT DEFAULT 'The sound of tomorrow, today. Discover the future of the music you love.',
  -- Contact Details
  contact_email TEXT,
  contact_email_subtext TEXT,
  contact_phone TEXT,
  contact_phone_subtext TEXT,
  contact_address TEXT,
  contact_address_subtext TEXT,
  social_links JSONB,
  hero_background_image TEXT,
  hero_background_video TEXT,
  hero_background_type TEXT DEFAULT 'image',
  hero_cta_text TEXT DEFAULT 'Explore Releases',
  hero_cta_link TEXT DEFAULT '/releases',
  hero_secondary_cta_text TEXT,
  hero_secondary_cta_link TEXT,
  show_hero_radio BOOLEAN DEFAULT TRUE,
  -- Marquee
  marquee_items JSONB DEFAULT '[{"text": "New Release: ECHOES EP", "icon": "Disc3"}, {"text": "Live Radio 24/7", "icon": "Radio"}, {"text": "Summer Tour 2025", "icon": "Music2"}, {"text": "50+ Artists Worldwide", "icon": "Users"}, {"text": "Stream Now on All Platforms", "icon": "Play"}, {"text": "GroupTherapy Sessions", "icon": "Headphones"}]'::jsonb,
  marquee_speed INTEGER DEFAULT 40,
  -- Stats
  stats_items JSONB DEFAULT '[{"value": 50, "suffix": "+", "prefix": "", "label": "Artists", "icon": "Users"}, {"value": 200, "suffix": "+", "prefix": "", "label": "Releases", "icon": "Disc3"}, {"value": 24, "suffix": "/7", "prefix": "", "label": "Radio", "icon": "Radio"}, {"value": 1, "suffix": "M+", "prefix": "", "label": "Streams", "icon": "Headphones"}]'::jsonb,
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO settings table
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Default Meta Tags
  default_title TEXT DEFAULT 'GroupTherapy | Electronic Music Label',
  default_description TEXT DEFAULT 'Discover the future of electronic music with GroupTherapy. Listen to our radio, explore new releases, and connect with artists worldwide.',
  default_keywords TEXT[] DEFAULT ARRAY['electronic music', 'music label', 'radio', 'artists', 'releases'],
  -- Social Preview
  og_image TEXT,
  twitter_image TEXT,
  twitter_handle TEXT DEFAULT '@grouptherapy',
  -- Structured Data Templates
  organization_schema JSONB DEFAULT '{
    "@type": "Organization",
    "name": "GroupTherapy",
    "url": "",
    "logo": "",
    "sameAs": []
  }'::jsonb,
  website_schema JSONB DEFAULT '{
    "@type": "WebSite",
    "name": "GroupTherapy",
    "url": "",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }'::jsonb,
  music_group_schema JSONB DEFAULT '{
    "@type": "MusicGroup",
    "name": "GroupTherapy",
    "genre": ["Electronic", "House", "Techno"],
    "foundingDate": "2020"
  }'::jsonb,
  -- Custom scripts
  head_scripts TEXT,
  body_scripts TEXT,
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- THERAPY AWARDS SYSTEM
-- ============================================================================

-- Award categories table
CREATE TABLE IF NOT EXISTS award_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- e.g., "Artist of the Month", "Track of the Week"
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('artist', 'track')), -- artist or track
  period TEXT NOT NULL CHECK (period IN ('week', 'month')), -- week or month
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Award periods table (e.g., "January 2025", "Week 1 2025")
CREATE TABLE IF NOT EXISTS award_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES award_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "January 2025", "Week 1 - January 2025"
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  voting_open BOOLEAN DEFAULT TRUE,
  winner_id UUID, -- Will reference award_entries
  announced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Award entries/nominees table
CREATE TABLE IF NOT EXISTS award_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES award_periods(id) ON DELETE CASCADE,
  -- For artist awards
  artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  artist_name TEXT,
  artist_image_url TEXT,
  artist_bio TEXT,
  -- For track awards
  track_title TEXT,
  track_artist TEXT,
  track_cover_url TEXT,
  track_audio_url TEXT,
  track_duration INTEGER,
  -- External links
  spotify_url TEXT,
  apple_music_url TEXT,
  soundcloud_url TEXT,
  -- Voting
  vote_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Award votes table (with duplicate prevention)
CREATE TABLE IF NOT EXISTS award_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES award_entries(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES award_periods(id) ON DELETE CASCADE,
  user_id UUID, -- Supabase auth user id (optional for anonymous voting)
  voter_ip TEXT,
  voter_email TEXT,
  fingerprint TEXT, -- Browser fingerprint for additional duplicate detection
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate votes per period per IP
  CONSTRAINT unique_vote_per_period_ip UNIQUE (period_id, voter_ip)
);

-- Update award_periods foreign key for winner
ALTER TABLE award_periods 
  DROP CONSTRAINT IF EXISTS award_periods_winner_id_fkey;
ALTER TABLE award_periods 
  ADD CONSTRAINT award_periods_winner_id_fkey 
  FOREIGN KEY (winner_id) REFERENCES award_entries(id) ON DELETE SET NULL;

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Analytics: Page views table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics: Events table (for tracking interactions)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_category TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  metadata JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics: Radio session tracking
CREATE TABLE IF NOT EXISTS radio_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID REFERENCES radio_shows(id) ON DELETE SET NULL,
  session_id TEXT,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - All authenticated users are admins
-- ============================================================================

-- Helper function to check if user is authenticated (all auth users are admins)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ARTISTS
CREATE POLICY "Public read artists" ON artists FOR SELECT USING (true);
CREATE POLICY "Admin manage artists" ON artists FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RELEASES
CREATE POLICY "Public read published releases" ON releases FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage releases" ON releases FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- EVENTS
CREATE POLICY "Public read published events" ON events FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage events" ON events FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- POSTS
CREATE POLICY "Public read published posts" ON posts FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage posts" ON posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RADIO SHOWS
CREATE POLICY "Public read published radio shows" ON radio_shows FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage radio shows" ON radio_shows FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RADIO TRACKS
CREATE POLICY "Public read radio tracks" ON radio_tracks FOR SELECT USING (true);
CREATE POLICY "Admin manage radio tracks" ON radio_tracks FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- PLAYLISTS
CREATE POLICY "Public read published playlists" ON playlists FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage playlists" ON playlists FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- VIDEOS
CREATE POLICY "Public read published videos" ON videos FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage videos" ON videos FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- CONTACTS
CREATE POLICY "Public submit contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read contacts" ON contacts FOR SELECT USING (is_admin());
CREATE POLICY "Admin manage contacts" ON contacts FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin delete contacts" ON contacts FOR DELETE USING (is_admin());

-- RADIO SETTINGS
CREATE POLICY "Public read radio settings" ON radio_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage radio settings" ON radio_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- CAREERS
CREATE POLICY "Public read published careers" ON careers FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage careers" ON careers FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- CAREER APPLICATIONS
CREATE POLICY "Public submit applications" ON career_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read applications" ON career_applications FOR SELECT USING (is_admin());
CREATE POLICY "Admin manage applications" ON career_applications FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin delete applications" ON career_applications FOR DELETE USING (is_admin());

-- TOURS
CREATE POLICY "Public read published tours" ON tours FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage tours" ON tours FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- TOUR DATES
CREATE POLICY "Public read tour dates" ON tour_dates FOR SELECT USING (true);
CREATE POLICY "Admin manage tour dates" ON tour_dates FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- STATIC PAGES
CREATE POLICY "Public read published static pages" ON static_pages FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage static pages" ON static_pages FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- NEWSLETTER SUBSCRIBERS
CREATE POLICY "Public subscribe newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read subscribers" ON newsletter_subscribers FOR SELECT USING (is_admin());
CREATE POLICY "Admin manage subscribers" ON newsletter_subscribers FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin delete subscribers" ON newsletter_subscribers FOR DELETE USING (is_admin());

-- TESTIMONIALS
CREATE POLICY "Public read published testimonials" ON testimonials FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage testimonials" ON testimonials FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- PRESS ASSETS
CREATE POLICY "Public read published press assets" ON press_assets FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admin manage press assets" ON press_assets FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- SITE SETTINGS
CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage site settings" ON site_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- SEO SETTINGS
CREATE POLICY "Public read seo settings" ON seo_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage seo settings" ON seo_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- PAGE VIEWS
CREATE POLICY "Public track page views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read page views" ON page_views FOR SELECT USING (is_admin());

-- ANALYTICS EVENTS
CREATE POLICY "Public track events" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read analytics" ON analytics_events FOR SELECT USING (is_admin());

-- RADIO SESSIONS
CREATE POLICY "Public track radio sessions" ON radio_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update radio sessions" ON radio_sessions FOR UPDATE USING (true);
CREATE POLICY "Admin read radio sessions" ON radio_sessions FOR SELECT USING (is_admin());

-- AWARD CATEGORIES
CREATE POLICY "Public read award categories" ON award_categories FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admin manage award categories" ON award_categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- AWARD PERIODS
CREATE POLICY "Public read award periods" ON award_periods FOR SELECT USING (true);
CREATE POLICY "Admin manage award periods" ON award_periods FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- AWARD ENTRIES
CREATE POLICY "Public read award entries" ON award_entries FOR SELECT USING (true);
CREATE POLICY "Admin manage award entries" ON award_entries FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- AWARD VOTES
CREATE POLICY "Public submit votes" ON award_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read votes" ON award_votes FOR SELECT USING (is_admin());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for site_settings
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for seo_settings
DROP TRIGGER IF EXISTS update_seo_settings_updated_at ON seo_settings;
CREATE TRIGGER update_seo_settings_updated_at
  BEFORE UPDATE ON seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for static_pages
DROP TRIGGER IF EXISTS update_static_pages_updated_at ON static_pages;
CREATE TRIGGER update_static_pages_updated_at
  BEFORE UPDATE ON static_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update vote count on award entries
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE award_entries SET vote_count = vote_count + 1 WHERE id = NEW.entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE award_entries SET vote_count = vote_count - 1 WHERE id = OLD.entry_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vote_count_trigger ON award_votes;
CREATE TRIGGER update_vote_count_trigger
  AFTER INSERT OR DELETE ON award_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_count();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_releases_published ON releases(published, release_date DESC);
CREATE INDEX IF NOT EXISTS idx_releases_slug ON releases(slug);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(published, date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_artists_featured ON artists(featured);
CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_radio_sessions_show ON radio_sessions(show_id);
CREATE INDEX IF NOT EXISTS idx_radio_shows_schedule ON radio_shows(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_award_votes_period ON award_votes(period_id);
CREATE INDEX IF NOT EXISTS idx_award_entries_period ON award_entries(period_id);

-- ============================================================================
-- DEFAULT DATA INSERTS
-- ============================================================================

-- Insert default site settings
INSERT INTO site_settings (
  hero_title, 
  hero_subtitle, 
  hero_background_type,
  hero_cta_text, 
  hero_cta_link, 
  show_hero_radio, 
  marquee_speed
)
VALUES (
  'GROUPTHERAPY', 
  'The sound of tomorrow, today. Discover the future of the music you love.', 
  'image',
  'Explore Releases', 
  '/releases', 
  true, 
  40
)
ON CONFLICT (id) DO NOTHING;

-- Insert default SEO settings
INSERT INTO seo_settings (
  default_title,
  default_description
)
VALUES (
  'GroupTherapy | Electronic Music Label',
  'Discover the future of electronic music with GroupTherapy. Listen to our radio, explore new releases, and connect with artists worldwide.'
)
ON CONFLICT (id) DO NOTHING;

-- Insert initial radio settings
INSERT INTO radio_settings (
  station_name, 
  stream_url, 
  is_live, 
  listener_count
)
VALUES (
  'GroupTherapy Radio', 
  'https://stream.zeno.fm/yn65fsaurfhvv', 
  true, 
  127
)
ON CONFLICT DO NOTHING;

-- Insert default static pages
INSERT INTO static_pages (slug, title, content, published) VALUES
('privacy-policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.</p><h3>Information We Collect</h3><p>We collect information you provide directly to us, such as when you subscribe to our newsletter, contact us, or interact with our services.</p><h3>How We Use Your Information</h3><p>We use the information we collect to provide, maintain, and improve our services, send you updates about new releases and events, and respond to your inquiries.</p>', true),
('terms-of-service', 'Terms of Service', '<h2>Terms of Service</h2><p>By accessing our website, you agree to these terms of service.</p><h3>Use of Service</h3><p>You may use our service only for lawful purposes and in accordance with these terms.</p><h3>Intellectual Property</h3><p>All content on this website, including music, images, and text, is protected by copyright and other intellectual property laws.</p>', true),
('cookie-policy', 'Cookie Policy', '<h2>Cookie Policy</h2><p>We use cookies to enhance your browsing experience.</p><h3>What Are Cookies</h3><p>Cookies are small text files that are stored on your device when you visit our website.</p><h3>Types of Cookies We Use</h3><p>We use essential cookies for website functionality and analytics cookies to understand how visitors interact with our site.</p>', true),
('about', 'About GroupTherapy', '<h2>About GroupTherapy</h2><p>GroupTherapy is a cutting-edge electronic music label dedicated to discovering and promoting the most innovative sounds in electronic music.</p><h3>Our Mission</h3><p>We believe in the power of music to connect people and create transformative experiences. Our mission is to support artists who push the boundaries of electronic music.</p><h3>What We Do</h3><p>From releasing groundbreaking music to hosting unforgettable events and running our 24/7 radio station, we are committed to building a global community of music lovers.</p>', true)
ON CONFLICT (slug) DO UPDATE SET 
  content = EXCLUDED.content,
  updated_at = NOW();

-- Insert default award categories
INSERT INTO award_categories (name, slug, description, type, period, display_order) VALUES
('Artist of the Month', 'artist-of-the-month', 'Vote for your favorite artist of the month', 'artist', 'month', 1),
('Artist of the Week', 'artist-of-the-week', 'Vote for your favorite artist of the week', 'artist', 'week', 2),
('Track of the Month', 'track-of-the-month', 'Vote for your favorite track of the month', 'track', 'month', 3),
('Track of the Week', 'track-of-the-week', 'Vote for your favorite track of the week', 'track', 'week', 4)
ON CONFLICT (slug) DO NOTHING;
