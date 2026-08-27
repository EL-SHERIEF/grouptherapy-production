-- Migration: Add partners logo marquee settings to site_settings
-- Adds JSONB list of partner logos and a speed integer.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS partners_marquee_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS partners_marquee_speed INTEGER DEFAULT 40,
  ADD COLUMN IF NOT EXISTS partners_marquee_gap INTEGER DEFAULT 48,
  ADD COLUMN IF NOT EXISTS partners_marquee_logo_height INTEGER DEFAULT 32,
  ADD COLUMN IF NOT EXISTS partners_marquee_use_muted_bg BOOLEAN DEFAULT false;

UPDATE site_settings
SET
  partners_marquee_items = COALESCE(partners_marquee_items, '[]'::jsonb),
  partners_marquee_speed = COALESCE(partners_marquee_speed, 40),
  partners_marquee_gap = COALESCE(partners_marquee_gap, 48),
  partners_marquee_logo_height = COALESCE(partners_marquee_logo_height, 32),
  partners_marquee_use_muted_bg = COALESCE(partners_marquee_use_muted_bg, false)
WHERE partners_marquee_items IS NULL
  OR partners_marquee_speed IS NULL
  OR partners_marquee_gap IS NULL
  OR partners_marquee_logo_height IS NULL
  OR partners_marquee_use_muted_bg IS NULL;
