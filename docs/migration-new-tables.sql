-- Migration for all tables defined in shared/schema.ts
-- Updated to match db-schema-fixed.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RLS helper: check Supabase user metadata role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'editor'),
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'contributor',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read users" ON users;
CREATE POLICY "Public can read users" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access to users" ON users;
CREATE POLICY "Admin full access to users" ON users FOR ALL USING (true);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'admin', -- admin, editor, contributor
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to admin_users" ON admin_users;
CREATE POLICY "Admin full access to admin_users" ON admin_users FOR ALL USING (true);

-- Login attempts tracking table
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  ip_address TEXT,
  successful BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_successful ON login_attempts(successful);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to login_attempts" ON login_attempts;
CREATE POLICY "Admin full access to login_attempts" ON login_attempts FOR ALL USING (true);

-- Artists roster
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

CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);
CREATE INDEX IF NOT EXISTS idx_artists_featured ON artists(featured);

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read artists" ON artists;
CREATE POLICY "Public can read artists" ON artists FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access to artists" ON artists;
CREATE POLICY "Admin full access to artists" ON artists FOR ALL USING (true);

-- Music releases
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

CREATE INDEX IF NOT EXISTS idx_releases_slug ON releases(slug);
CREATE INDEX IF NOT EXISTS idx_releases_artist_id ON releases(artist_id);
CREATE INDEX IF NOT EXISTS idx_releases_published ON releases(published);
CREATE INDEX IF NOT EXISTS idx_releases_featured ON releases(featured);
CREATE INDEX IF NOT EXISTS idx_releases_published ON releases(published, release_date DESC);

ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published releases" ON releases;
CREATE POLICY "Public can read published releases" ON releases FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to releases" ON releases;
CREATE POLICY "Admin full access to releases" ON releases FOR ALL USING (true);

-- Events
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

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(published);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(published, date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published events" ON events;
CREATE POLICY "Public can read published events" ON events FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to events" ON events;
CREATE POLICY "Admin full access to events" ON events FOR ALL USING (true);

-- Blog posts / News
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

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, published_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published posts" ON posts;
CREATE POLICY "Public can read published posts" ON posts FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to posts" ON posts;
CREATE POLICY "Admin full access to posts" ON posts FOR ALL USING (true);

-- Radio shows
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
  day_of_week INTEGER,
  start_time TEXT,
  end_time TEXT,
  timezone TEXT DEFAULT 'UTC',
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  is_live BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_shows_slug ON radio_shows(slug);
CREATE INDEX IF NOT EXISTS idx_radio_shows_published ON radio_shows(published);
CREATE INDEX IF NOT EXISTS idx_radio_shows_is_live ON radio_shows(is_live);
CREATE INDEX IF NOT EXISTS idx_radio_shows_schedule ON radio_shows(day_of_week, start_time);

ALTER TABLE radio_shows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published radio_shows" ON radio_shows;
CREATE POLICY "Public can read published radio_shows" ON radio_shows FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to radio_shows" ON radio_shows;
CREATE POLICY "Admin full access to radio_shows" ON radio_shows FOR ALL USING (true);

-- Radio track history
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

CREATE INDEX IF NOT EXISTS idx_radio_tracks_show_id ON radio_tracks(show_id);
CREATE INDEX IF NOT EXISTS idx_radio_tracks_played_at ON radio_tracks(played_at);

ALTER TABLE radio_tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read radio_tracks" ON radio_tracks;
CREATE POLICY "Public can read radio_tracks" ON radio_tracks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access to radio_tracks" ON radio_tracks;
CREATE POLICY "Admin full access to radio_tracks" ON radio_tracks FOR ALL USING (true);

-- Playlists
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

CREATE INDEX IF NOT EXISTS idx_playlists_slug ON playlists(slug);
CREATE INDEX IF NOT EXISTS idx_playlists_published ON playlists(published);
CREATE INDEX IF NOT EXISTS idx_playlists_featured ON playlists(featured);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published playlists" ON playlists;
CREATE POLICY "Public can read published playlists" ON playlists FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to playlists" ON playlists;
CREATE POLICY "Admin full access to playlists" ON playlists FOR ALL USING (true);

-- Videos
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

CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(published);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(featured);
CREATE INDEX IF NOT EXISTS idx_videos_artist_id ON videos(artist_id);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published videos" ON videos;
CREATE POLICY "Public can read published videos" ON videos FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to videos" ON videos;
CREATE POLICY "Admin full access to videos" ON videos FOR ALL USING (true);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  social_links JSONB,
  "order" INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published team_members" ON team_members;
CREATE POLICY "Public can read published team_members" ON team_members FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to team_members" ON team_members;
CREATE POLICY "Admin full access to team_members" ON team_members FOR ALL USING (true);

-- Contact submissions
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

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to contacts" ON contacts;
CREATE POLICY "Admin full access to contacts" ON contacts FOR ALL USING (true);

-- Press kit / Media assets
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

ALTER TABLE press_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published press_assets" ON press_assets;
CREATE POLICY "Public can read published press_assets" ON press_assets FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to press_assets" ON press_assets;
CREATE POLICY "Admin full access to press_assets" ON press_assets FOR ALL USING (true);

-- Radio station settings
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

ALTER TABLE radio_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read radio_settings" ON radio_settings;
CREATE POLICY "Public can read radio_settings" ON radio_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access to radio_settings" ON radio_settings;
CREATE POLICY "Admin full access to radio_settings" ON radio_settings FOR ALL USING (true);

-- Sessions table for serverless authentication
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(256) PRIMARY KEY,
  username TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to sessions" ON sessions;
CREATE POLICY "Admin full access to sessions" ON sessions FOR ALL USING (true);

-- Analytics - Page views
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_view_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to page_views" ON page_views;
CREATE POLICY "Admin full access to page_views" ON page_views FOR ALL USING (true);

-- Analytics - Play counts for releases
CREATE TABLE IF NOT EXISTS play_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  session_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_play_counts_release_id ON play_counts(release_id);
CREATE INDEX IF NOT EXISTS idx_play_counts_played_at ON play_counts(played_at);
CREATE INDEX IF NOT EXISTS idx_play_counts_session_id ON play_counts(session_id);

ALTER TABLE play_counts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to play_counts" ON play_counts;
CREATE POLICY "Admin full access to play_counts" ON play_counts FOR ALL USING (true);

-- Analytics - Radio listeners
CREATE TABLE IF NOT EXISTS radio_listeners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID REFERENCES radio_shows(id) ON DELETE CASCADE,
  session_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER
);

CREATE INDEX IF NOT EXISTS idx_radio_listeners_show_id ON radio_listeners(show_id);
CREATE INDEX IF NOT EXISTS idx_radio_listeners_started_at ON radio_listeners(started_at);
CREATE INDEX IF NOT EXISTS idx_radio_listeners_session_id ON radio_listeners(session_id);

ALTER TABLE radio_listeners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to radio_listeners" ON radio_listeners;
CREATE POLICY "Admin full access to radio_listeners" ON radio_listeners FOR ALL USING (true);

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

CREATE INDEX IF NOT EXISTS idx_tours_published ON tours(published);
CREATE INDEX IF NOT EXISTS idx_tours_slug ON tours(slug);

ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published tours" ON tours;
CREATE POLICY "Public can read published tours" ON tours FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to tours" ON tours;
CREATE POLICY "Admin full access to tours" ON tours FOR ALL USING (true);

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

CREATE INDEX IF NOT EXISTS idx_tour_dates_tour_id ON tour_dates(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_dates_date ON tour_dates(date);

ALTER TABLE tour_dates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read tour dates" ON tour_dates;
CREATE POLICY "Public can read tour dates" ON tour_dates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access to tour_dates" ON tour_dates;
CREATE POLICY "Admin full access to tour_dates" ON tour_dates FOR ALL USING (true);

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

CREATE INDEX IF NOT EXISTS idx_careers_published ON careers(published);
CREATE INDEX IF NOT EXISTS idx_careers_slug ON careers(slug);

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published careers" ON careers;
CREATE POLICY "Public can read published careers" ON careers FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to careers" ON careers;
CREATE POLICY "Admin full access to careers" ON careers FOR ALL USING (true);

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

ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public submit applications" ON career_applications;
CREATE POLICY "Public submit applications" ON career_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin read applications" ON career_applications;
CREATE POLICY "Admin read applications" ON career_applications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage applications" ON career_applications;
CREATE POLICY "Admin manage applications" ON career_applications FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin delete applications" ON career_applications;
CREATE POLICY "Admin delete applications" ON career_applications FOR DELETE USING (true);

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'website',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  CONSTRAINT newsletter_email_unique UNIQUE (email)
);

-- Newsletter subscriber states (global definitions)
CREATE TABLE IF NOT EXISTS newsletter_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend newsletter_subscribers for smart segmentation
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

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(active);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public subscribe newsletter" ON newsletter_subscribers;
CREATE POLICY "Public subscribe newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin read subscribers" ON newsletter_subscribers;
CREATE POLICY "Admin read subscribers" ON newsletter_subscribers FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admin manage subscribers" ON newsletter_subscribers;
CREATE POLICY "Admin manage subscribers" ON newsletter_subscribers FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admin delete subscribers" ON newsletter_subscribers;
CREATE POLICY "Admin delete subscribers" ON newsletter_subscribers FOR DELETE USING (is_admin());

ALTER TABLE newsletter_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin read newsletter states" ON newsletter_states;
CREATE POLICY "Admin read newsletter states" ON newsletter_states FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admin manage newsletter states" ON newsletter_states;
CREATE POLICY "Admin manage newsletter states" ON newsletter_states FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Auto-subscribe any new contact with an email into newsletter list
CREATE OR REPLACE FUNCTION newsletter_auto_subscribe_from_contact()
RETURNS TRIGGER AS $$
DECLARE
  default_state UUID;
BEGIN
  IF NEW.email IS NULL OR length(trim(NEW.email)) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO default_state FROM newsletter_states WHERE key = 'default' LIMIT 1;

  INSERT INTO newsletter_subscribers (email, name, source, active, subscribed_at, unsubscribed_at, opted_out, opted_out_at, state_id)
  VALUES (lower(NEW.email), NEW.name, 'contact', true, NOW(), NULL, false, NULL, default_state)
  ON CONFLICT (email) DO UPDATE
  SET
    name = COALESCE(EXCLUDED.name, newsletter_subscribers.name),
    source = COALESCE(newsletter_subscribers.source, EXCLUDED.source),
    state_id = COALESCE(newsletter_subscribers.state_id, EXCLUDED.state_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_newsletter_auto_subscribe_contact ON contacts;
CREATE TRIGGER trigger_newsletter_auto_subscribe_contact
  AFTER INSERT OR UPDATE OF email, name ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION newsletter_auto_subscribe_from_contact();

-- SEO settings table
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_title TEXT DEFAULT 'GroupTherapy | Electronic Music Label',
  default_description TEXT DEFAULT 'Discover the future of electronic music with GroupTherapy. Listen to our radio, explore new releases, and connect with artists worldwide.',
  default_keywords TEXT[] DEFAULT ARRAY['electronic music', 'music label', 'radio', 'artists', 'releases'],
  og_image TEXT,
  twitter_image TEXT,
  twitter_handle TEXT DEFAULT '@grouptherapy',
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
  head_scripts TEXT,
  body_scripts TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read seo settings" ON seo_settings;
CREATE POLICY "Public read seo settings" ON seo_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access to seo_settings" ON seo_settings;
CREATE POLICY "Admin full access to seo_settings" ON seo_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Award categories table
CREATE TABLE IF NOT EXISTS award_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('artist', 'track')),
  period TEXT NOT NULL CHECK (period IN ('week', 'month')),
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_award_categories_slug ON award_categories(slug);
CREATE INDEX IF NOT EXISTS idx_award_categories_active ON award_categories(is_active);

ALTER TABLE award_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active award categories" ON award_categories;
CREATE POLICY "Public can read active award categories" ON award_categories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin full access to award_categories" ON award_categories;
CREATE POLICY "Admin full access to award_categories" ON award_categories FOR ALL USING (true);

-- Award periods table
CREATE TABLE IF NOT EXISTS award_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES award_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  voting_open BOOLEAN DEFAULT TRUE,
  winner_id UUID,
  announced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_award_periods_category_id ON award_periods(category_id);
CREATE INDEX IF NOT EXISTS idx_award_periods_voting_open ON award_periods(voting_open);

ALTER TABLE award_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read award periods" ON award_periods;
CREATE POLICY "Public can read award periods" ON award_periods FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access to award_periods" ON award_periods;
CREATE POLICY "Admin full access to award_periods" ON award_periods FOR ALL USING (true);

-- Award entries table
CREATE TABLE IF NOT EXISTS award_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES award_periods(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  artist_name TEXT,
  artist_image_url TEXT,
  artist_bio TEXT,
  track_title TEXT,
  track_artist TEXT,
  track_cover_url TEXT,
  track_audio_url TEXT,
  track_duration INTEGER,
  spotify_url TEXT,
  apple_music_url TEXT,
  soundcloud_url TEXT,
  vote_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_award_entries_period_id ON award_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_award_entries_vote_count ON award_entries(vote_count);

ALTER TABLE award_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read award entries" ON award_entries;
CREATE POLICY "Public can read award entries" ON award_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access to award_entries" ON award_entries;
CREATE POLICY "Admin full access to award_entries" ON award_entries FOR ALL USING (true);

-- Award votes table
CREATE TABLE IF NOT EXISTS award_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES award_entries(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES award_periods(id) ON DELETE CASCADE,
  user_id UUID,
  voter_ip TEXT,
  voter_email TEXT,
  fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_vote_per_period_ip UNIQUE (period_id, voter_ip)
);

CREATE INDEX IF NOT EXISTS idx_award_votes_entry_id ON award_votes(entry_id);
CREATE INDEX IF NOT EXISTS idx_award_votes_period_id ON award_votes(period_id);
CREATE INDEX IF NOT EXISTS idx_award_votes_fingerprint ON award_votes(fingerprint);

ALTER TABLE award_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public submit votes" ON award_votes;
CREATE POLICY "Public submit votes" ON award_votes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin read votes" ON award_votes;
CREATE POLICY "Admin read votes" ON award_votes FOR SELECT USING (true);

-- Static pages table
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

CREATE INDEX IF NOT EXISTS idx_static_pages_slug ON static_pages(slug);
CREATE INDEX IF NOT EXISTS idx_static_pages_published ON static_pages(published);

ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published static pages" ON static_pages;
CREATE POLICY "Public can read published static pages" ON static_pages FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to static_pages" ON static_pages;
CREATE POLICY "Admin full access to static_pages" ON static_pages FOR ALL USING (true);

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

CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(published);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published testimonials" ON testimonials;
CREATE POLICY "Public can read published testimonials" ON testimonials FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admin full access to testimonials" ON testimonials;
CREATE POLICY "Admin full access to testimonials" ON testimonials FOR ALL USING (true);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hero_tag TEXT,
  hero_title TEXT DEFAULT 'GROUPTHERAPY',
  hero_subtitle TEXT DEFAULT 'The sound of tomorrow, today. Discover the future of the music you love.',
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
  marquee_items JSONB DEFAULT '[{"text": "New Release: ECHOES EP", "icon": "Disc3"}, {"text": "Live Radio 24/7", "icon": "Radio"}, {"text": "Summer Tour 2025", "icon": "Music2"}, {"text": "50+ Artists Worldwide", "icon": "Users"}, {"text": "Stream Now on All Platforms", "icon": "Play"}, {"text": "GroupTherapy Sessions", "icon": "Headphones"}]'::jsonb,
  marquee_speed INTEGER DEFAULT 40,
  stats_items JSONB DEFAULT '[{"value": 50, "suffix": "+", "prefix": "", "label": "Artists", "icon": "Users"}, {"value": 200, "suffix": "+", "prefix": "", "label": "Releases", "icon": "Disc3"}, {"value": 24, "suffix": "/7", "prefix": "", "label": "Radio", "icon": "Radio"}, {"value": 1, "suffix": "M+", "prefix": "", "label": "Streams", "icon": "Headphones"}]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS social_links JSONB;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read site_settings" ON site_settings;
CREATE POLICY "Public can read site_settings" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access to site_settings" ON site_settings;
CREATE POLICY "Admin full access to site_settings" ON site_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Analytics events table
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

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to analytics_events" ON analytics_events;
CREATE POLICY "Admin full access to analytics_events" ON analytics_events FOR ALL USING (true);

-- Radio sessions table
CREATE TABLE IF NOT EXISTS radio_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID REFERENCES radio_shows(id) ON DELETE SET NULL,
  session_id TEXT,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_sessions_show_id ON radio_sessions(show_id);
CREATE INDEX IF NOT EXISTS idx_radio_sessions_session_id ON radio_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_radio_sessions_started_at ON radio_sessions(started_at);

ALTER TABLE radio_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public track radio sessions" ON radio_sessions;
CREATE POLICY "Public track radio sessions" ON radio_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update radio sessions" ON radio_sessions;
CREATE POLICY "Public update radio sessions" ON radio_sessions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin read radio sessions" ON radio_sessions;
CREATE POLICY "Admin read radio sessions" ON radio_sessions FOR SELECT USING (true);

-- Update award_periods foreign key for winner
ALTER TABLE award_periods 
  DROP CONSTRAINT IF EXISTS award_periods_winner_id_fkey;
ALTER TABLE award_periods 
  ADD CONSTRAINT award_periods_winner_id_fkey 
  FOREIGN KEY (winner_id) REFERENCES award_entries(id) ON DELETE SET NULL;
