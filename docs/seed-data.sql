-- ============================================================================
-- SEED DATA - Sample entries for testing
-- GroupTherapy Music Label
-- ============================================================================
-- Run this AFTER running the main schema
-- ============================================================================

-- Sample Artists
INSERT INTO artists (name, slug, bio, featured, social_links) VALUES
('Neon Pulse', 'neon-pulse', 'Rising star in the electronic music scene, known for atmospheric soundscapes and pulsating rhythms.', true, '{"instagram": "https://instagram.com/neonpulse", "spotify": "https://spotify.com/artist/neonpulse", "soundcloud": "https://soundcloud.com/neonpulse"}'),
('Deep Circuit', 'deep-circuit', 'Berlin-based producer crafting deep, hypnotic techno that moves body and soul.', true, '{"instagram": "https://instagram.com/deepcircuit", "twitter": "https://twitter.com/deepcircuit"}'),
('Aurora Nights', 'aurora-nights', 'Melodic house producer creating emotional journeys through sound.', false, '{"spotify": "https://spotify.com/artist/auroranights"}'),
('Bass Foundation', 'bass-foundation', 'Heavy-hitting bass music collective pushing the boundaries of low frequencies.', true, '{"soundcloud": "https://soundcloud.com/bassfoundation", "youtube": "https://youtube.com/bassfoundation"}')
ON CONFLICT (slug) DO NOTHING;

-- Sample Releases
INSERT INTO releases (title, slug, artist_name, type, genres, published, release_date, featured) VALUES
('Echoes EP', 'echoes-ep', 'Neon Pulse', 'ep', ARRAY['Techno', 'Ambient'], true, NOW() - INTERVAL '7 days', true),
('Midnight Drive', 'midnight-drive', 'Deep Circuit', 'single', ARRAY['Deep House', 'Melodic Techno'], true, NOW() - INTERVAL '14 days', true),
('Starlight Sessions Vol. 1', 'starlight-sessions-vol-1', 'Aurora Nights', 'album', ARRAY['Progressive House', 'Trance'], true, NOW() - INTERVAL '30 days', false),
('Subterranean', 'subterranean', 'Bass Foundation', 'ep', ARRAY['Dubstep', 'Bass'], true, NOW() - INTERVAL '3 days', true),
('Digital Dreams', 'digital-dreams', 'Neon Pulse', 'single', ARRAY['Synthwave', 'Electro'], false, NOW() + INTERVAL '7 days', false)
ON CONFLICT (slug) DO NOTHING;

-- Sample Events
INSERT INTO events (title, slug, description, venue, city, country, date, published, featured) VALUES
('GroupTherapy Festival 2025', 'grouptherapy-festival-2025', 'Our annual festival featuring the best in electronic music. Three stages, 50+ artists, one unforgettable weekend.', 'Warehouse District', 'Los Angeles', 'USA', NOW() + INTERVAL '60 days', true, true),
('Deep Sessions: Berlin', 'deep-sessions-berlin', 'An intimate night of deep house and techno in the heart of Berlin.', 'Tresor', 'Berlin', 'Germany', NOW() + INTERVAL '30 days', true, true),
('Bass Night', 'bass-night', 'Heavy bass music night featuring Bass Foundation and special guests.', 'The Underground', 'London', 'UK', NOW() + INTERVAL '14 days', true, false)
ON CONFLICT (slug) DO NOTHING;

-- Sample Blog Posts
INSERT INTO posts (title, slug, excerpt, content, category, published, published_at, featured) VALUES
('Introducing Our New Artist: Neon Pulse', 'introducing-neon-pulse', 'We are thrilled to welcome Neon Pulse to the GroupTherapy family.', '<p>We are thrilled to welcome Neon Pulse to the GroupTherapy family. With their unique blend of atmospheric techno and pulsating rhythms, they are set to make waves in the electronic music scene.</p><p>Stay tuned for their debut EP "Echoes" dropping next week!</p>', 'news', true, NOW() - INTERVAL '7 days', true),
('Festival Lineup Announced', 'festival-lineup-2025', 'Check out the full lineup for GroupTherapy Festival 2025.', '<p>We are excited to announce the full lineup for GroupTherapy Festival 2025. This year''s edition promises to be our biggest yet, with over 50 artists across three stages.</p>', 'news', true, NOW() - INTERVAL '3 days', true),
('Studio Diary: Making of Echoes EP', 'studio-diary-echoes', 'Go behind the scenes with Neon Pulse as they create their debut EP.', '<p>Join us in the studio with Neon Pulse as they break down the creative process behind their debut EP "Echoes".</p>', 'feature', true, NOW() - INTERVAL '5 days', false)
ON CONFLICT (slug) DO NOTHING;

-- Sample Radio Shows
INSERT INTO radio_shows (title, slug, description, host_name, day_of_week, start_time, end_time, timezone, published) VALUES
('The Morning Session', 'morning-session', 'Start your day right with the best in electronic music. Deep house, melodic techno, and feel-good vibes.', 'DJ Aurora', 1, '08:00', '10:00', 'UTC', true),
('Deep Dive', 'deep-dive', 'Two hours of the deepest underground sounds. Minimal, dub techno, and experimental electronica.', 'Deep Circuit', 3, '22:00', '00:00', 'UTC', true),
('Bass Therapy', 'bass-therapy', 'Heavy bass music for the weekend warriors. Dubstep, drum & bass, and everything in between.', 'Bass Foundation', 5, '20:00', '23:00', 'UTC', true),
('Sunday Sessions', 'sunday-sessions', 'Wind down your weekend with ambient soundscapes and chilled electronica.', 'Neon Pulse', 0, '18:00', '20:00', 'UTC', true)
ON CONFLICT (slug) DO NOTHING;

-- Sample Playlists
INSERT INTO playlists (title, slug, description, track_count, featured, published) VALUES
('GroupTherapy Essentials', 'grouptherapy-essentials', 'The definitive collection of GroupTherapy releases. Updated weekly.', 50, true, true),
('Late Night Sessions', 'late-night-sessions', 'Perfect soundtrack for those late night creative sessions.', 30, true, true),
('Festival Warm-Up', 'festival-warmup', 'Get ready for GroupTherapy Festival with this high-energy playlist.', 40, false, true)
ON CONFLICT (slug) DO NOTHING;

-- Sample Testimonials
INSERT INTO testimonials (name, role, content, rating, display_order, published) VALUES
('Alex Thompson', 'Music Producer', 'GroupTherapy has been instrumental in launching my career. Their support for emerging artists is unmatched.', 5, 1, true),
('Sarah Chen', 'Festival Attendee', 'Best festival experience of my life! The production quality and artist selection were incredible.', 5, 2, true),
('Marcus Webb', 'DJ / Producer', 'Being part of the GroupTherapy family has opened doors I never knew existed. Truly a game-changer.', 5, 3, true)
ON CONFLICT DO NOTHING;

-- Sample Careers
INSERT INTO careers (title, slug, department, location, type, description, requirements, published) VALUES
('A&R Manager', 'ar-manager', 'Music', 'Los Angeles, CA (Remote OK)', 'Full-time', 'We are looking for a passionate A&R Manager to discover and develop new talent for our roster.', 'Minimum 3 years experience in A&R or artist management. Deep knowledge of electronic music genres. Strong network within the industry.', true),
('Social Media Coordinator', 'social-media-coordinator', 'Marketing', 'Remote', 'Full-time', 'Join our marketing team to manage and grow our social media presence across all platforms.', 'Experience managing social media for music brands. Strong understanding of analytics and engagement strategies. Creative content creation skills.', true)
ON CONFLICT (slug) DO NOTHING;

-- Sample Award Period (Current Month)
INSERT INTO award_periods (category_id, name, start_date, end_date, voting_open)
SELECT 
  id,
  TO_CHAR(NOW(), 'Month YYYY'),
  DATE_TRUNC('month', NOW()),
  DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day',
  true
FROM award_categories 
WHERE slug = 'artist-of-the-month'
ON CONFLICT DO NOTHING;

-- Sample Award Entries for current period
INSERT INTO award_entries (period_id, artist_name, artist_bio)
SELECT 
  ap.id,
  a.name,
  a.bio
FROM award_periods ap
CROSS JOIN artists a
WHERE ap.voting_open = true
AND a.featured = true
LIMIT 4
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the seed data was inserted correctly:
--
-- SELECT COUNT(*) as artists FROM artists;
-- SELECT COUNT(*) as releases FROM releases;
-- SELECT COUNT(*) as events FROM events;
-- SELECT COUNT(*) as posts FROM posts;
-- SELECT COUNT(*) as radio_shows FROM radio_shows;
-- SELECT COUNT(*) as testimonials FROM testimonials;
-- SELECT COUNT(*) as award_categories FROM award_categories;
-- ============================================================================
