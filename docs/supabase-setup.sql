-- ============================================================================
-- SUPABASE SETUP SCRIPT - Run in SQL Editor
-- GroupTherapy Music Label
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 5. After running, enable email authentication in Auth > Providers
--
-- ============================================================================

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create vote count update function
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

-- ============================================================================
-- Now run the full schema from docs/db-schema-fixed.sql
-- The file contains all tables, RLS policies, triggers, and indexes
-- ============================================================================

-- After running the schema, verify with:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================================================
-- ADDITIONAL SUPABASE CONFIGURATION (Do this in the Dashboard)
-- ============================================================================
--
-- 1. AUTHENTICATION SETUP:
--    - Go to Authentication > Providers
--    - Enable "Email" provider
--    - Disable "Confirm email" for testing (optional)
--    - Set password requirements as needed
--
-- 2. STORAGE BUCKETS (for file uploads):
--    - Go to Storage
--    - Create bucket: "images" (public)
--    - Create bucket: "audio" (public)  
--    - Create bucket: "videos" (public)
--    - Create bucket: "documents" (public)
--
-- 3. STORAGE POLICIES (run these if using Supabase Storage):

-- CREATE POLICY "Public read images" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'images');
-- CREATE POLICY "Admin upload images" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Admin delete images" ON storage.objects 
--   FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- CREATE POLICY "Public read audio" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'audio');
-- CREATE POLICY "Admin upload audio" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');

-- CREATE POLICY "Public read videos" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'videos');
-- CREATE POLICY "Admin upload videos" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- ============================================================================
-- ENVIRONMENT VARIABLES REQUIRED
-- ============================================================================
--
-- In your Replit project, set these environment variables:
--
-- VITE_SUPABASE_URL=https://your-project.supabase.co
-- VITE_SUPABASE_ANON_KEY=your-anon-key
--
-- Optional (for server-side operations):
-- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
--
-- ============================================================================
