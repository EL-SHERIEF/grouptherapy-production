# Database Updates for New Features

## Summary
This document describes the database-related changes for the new features added to GroupTherapy Music Label website.

## Important: Your Existing Data is Safe
All changes are **additive** and do not modify or delete existing data. Your current Supabase database will work without any modifications.

## Existing Tables Used (No Changes Needed)
The following tables from your existing schema are now actively used:

### Awards System
These tables already exist in your schema (`docs/db-schema-fixed.sql`):

1. **`award_categories`** - Stores award category definitions
   - `id`, `name`, `slug`, `description`, `type`, `period`, `is_active`, `display_order`, `created_at`

2. **`award_periods`** - Stores voting periods
   - `id`, `category_id`, `name`, `start_date`, `end_date`, `voting_open`, `winner_id`, `announced_at`, `created_at`

3. **`award_entries`** - Stores nominees/entries
   - `id`, `period_id`, `artist_id`, `artist_name`, `artist_image_url`, `artist_bio`, `track_title`, `track_artist`, `track_cover_url`, `track_audio_url`, `track_duration`, `spotify_url`, `apple_music_url`, `soundcloud_url`, `vote_count`, `display_order`, `is_winner`, `created_at`

4. **`award_votes`** - Stores individual votes
   - `id`, `entry_id`, `period_id`, `user_id`, `voter_ip`, `voter_email`, `fingerprint`, `created_at`

### Radio System
These tables are used for radio listener analytics and show status:

1. **`radio_shows`** - Stores radio show schedules (existing)
2. **`radio_settings`** - Stores current radio state including `listener_count` (existing)

## Optional Enhancement: SoundCloud URL for Radio Tracks

If you want to support SoundCloud links in the Recent Streams feature, you can add this field:

```sql
-- Optional: Add soundcloud_url to radio_tracks table
ALTER TABLE radio_tracks 
ADD COLUMN IF NOT EXISTS soundcloud_url TEXT;
```

This is **optional** - the feature works without this field by using the existing audio URL fields.

## Playlist Track Count

The `track_count` field in the `playlists` table is now properly populated when you:
1. Fetch metadata from Spotify using the "Fetch Metadata" button in admin
2. The Spotify API returns the actual track count

No schema changes needed - the field already exists.

## How to Set Up Awards (If Not Done Yet)

1. Go to Admin → Awards
2. Create a **Category** (e.g., "Artist of the Month", type: artist, period: month)
3. Create a **Period** (e.g., "December 2024", set dates, toggle voting open)
4. Add **Entries** (nominees - artists or tracks with images)
5. The Awards page at `/awards` will now show voting UI
6. Home page will display a vote section if any period has voting open

## RLS Policies (Already Set Up)
The existing Row Level Security policies in your schema allow:
- Public read access to all content tables
- Authenticated (admin) write access

## Environment Variables Required
These are already set up in your project:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` (for playlist metadata)

## No Migration Needed
Since all tables already exist in your schema, no migration is required. The new features will work immediately with your existing database.

## Quick Verification

Run this query in Supabase SQL Editor to verify your awards tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'award%';
```

You should see:
- `award_categories`
- `award_entries`
- `award_periods`
- `award_votes`
