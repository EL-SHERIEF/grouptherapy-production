
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  image_url TEXT,
  spotify_artist_id TEXT,
  social_links JSONB,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Releases table
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  artist_id UUID REFERENCES artists(id),
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

-- Radio shows table
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
  played_at TIMESTAMPTZ NOT NULL,
  show_id UUID REFERENCES radio_shows(id),
  soundcloud_url TEXT,
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
  artist_id UUID REFERENCES artists(id),
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
  career_id UUID REFERENCES careers(id),
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

-- Static pages table (for terms, privacy, cookies, etc.)
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

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER DEFAULT 5,
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

-- Site settings table (for homepage content control)
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
  show_hero_radio BOOLEAN DEFAULT TRUE,
  marquee_items JSONB DEFAULT '[{"text": "New Release: ECHOES EP", "icon": "Disc3"}, {"text": "Live Radio 24/7", "icon": "Radio"}, {"text": "Summer Tour 2025", "icon": "Music2"}, {"text": "50+ Artists Worldwide", "icon": "Users"}, {"text": "Stream Now on All Platforms", "icon": "Play"}, {"text": "GroupTherapy Sessions", "icon": "Headphones"}]'::jsonb,
  marquee_speed INTEGER DEFAULT 40,
  stats_items JSONB DEFAULT '[{"value": 50, "suffix": "+", "prefix": "", "label": "Artists", "icon": "Users"}, {"value": 200, "suffix": "+", "prefix": "", "label": "Releases", "icon": "Disc3"}, {"value": 24, "suffix": "/7", "prefix": "", "label": "Radio", "icon": "Radio"}, {"value": 1, "suffix": "M+", "prefix": "", "label": "Streams", "icon": "Headphones"}]'::jsonb,
  newsletter_title TEXT DEFAULT 'Join the community',
  newsletter_description TEXT DEFAULT 'Get exclusive releases, early event access, and behind-the-scenes content.',
  newsletter_button_text TEXT DEFAULT 'Subscribe',
  newsletter_disclaimer TEXT DEFAULT 'No spam. Unsubscribe anytime.',
  page_hero_overrides JSONB DEFAULT '{}'::jsonb,
  home_sections JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  show_id UUID REFERENCES radio_shows(id),
  session_id TEXT,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
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
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access policies (allows everyone to read published content)
CREATE POLICY "Public read access for artists" ON artists FOR SELECT USING (true);
CREATE POLICY "Public read access for releases" ON releases FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for events" ON events FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for posts" ON posts FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for radio_shows" ON radio_shows FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for radio_tracks" ON radio_tracks FOR SELECT USING (true);
CREATE POLICY "Public read access for playlists" ON playlists FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for videos" ON videos FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for radio_settings" ON radio_settings FOR SELECT USING (true);
CREATE POLICY "Public read access for careers" ON careers FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for tours" ON tours FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for tour_dates" ON tour_dates FOR SELECT USING (true);
CREATE POLICY "Public read access for static_pages" ON static_pages FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for testimonials" ON testimonials FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for press_assets" ON press_assets FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Public read access for site_settings" ON site_settings FOR SELECT USING (true);

-- Public insert policies for user submissions
CREATE POLICY "Public can submit contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can subscribe to newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can submit career applications" ON career_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can track page views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can track events" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can track radio sessions" ON radio_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update radio sessions" ON radio_sessions FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for site_settings
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
('privacy-policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.</p>', true),
('terms-of-service', 'Terms of Service', '<h2>Terms of Service</h2><p>By accessing our website, you agree to these terms of service.</p>', true),
('cookie-policy', 'Cookie Policy', '<h2>Cookie Policy</h2><p>We use cookies to enhance your browsing experience.</p>', true)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_releases_published ON releases(published, release_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(published, date);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_artists_featured ON artists(featured);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_radio_sessions_show ON radio_sessions(show_id);
