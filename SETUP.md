
# GroupTherapy Music Platform - Setup Guide

## Overview

GroupTherapy is a comprehensive music platform featuring:
- **Live Radio**: Real-time streaming with live chat and listener tracking
- **Artist Management**: Artist profiles, releases, and discographies
- **Events & Tours**: Event calendar with ticket integration
- **Content Management**: News, playlists, videos, and press kits
- **Admin Dashboard**: Full content management system

The platform uses:
- **Supabase**: PostgreSQL database for persistent content storage
- **Firebase Realtime Database**: Real-time features (live chat, listener count, radio sessions)
- **Cloudinary**: Image and media uploads (optional)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Supabase Setup](#supabase-setup)
4. [Firebase Setup](#firebase-setup)
5. [Cloudinary Setup](#cloudinary-setup-optional)
6. [Running the Application](#running-the-application)
7. [Admin Access](#admin-access)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up the platform, ensure you have:

- **Node.js** 18.0.0 or higher
- **npm** (comes with Node.js)
- **Supabase Account**: Free tier at [supabase.com](https://supabase.com)
- **Firebase Account**: Free tier at [firebase.google.com](https://firebase.google.com)
- **Cloudinary Account** (optional): Free tier at [cloudinary.com](https://cloudinary.com)

---

## Environment Variables

The application uses environment variables for configuration. These should be set in the Replit Secrets tool (padlock icon in the sidebar).

### Required Variables

#### Supabase (Required)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Firebase (Required for Radio Features)
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### Cloudinary (Optional)
```
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=unsigned
```

**Note**: All environment variables are prefixed with `VITE_` to be accessible in the client-side Vite build.

---

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Enter a project name (e.g., `grouptherapy`)
4. Set a secure database password
5. Choose a region close to your users
6. Click **Create new project**

### Step 2: Get Your API Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the **Project URL** → `VITE_SUPABASE_URL`
3. Copy the **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. Add these to your Replit Secrets

### Step 3: Run the Database Schema

1. Navigate to **SQL Editor** in the Supabase dashboard
2. Click **New Query**
3. Copy the contents of `client/src/lib/supabase-schema.sql`
4. Paste into the SQL Editor and click **Run**

This creates all necessary tables:
- `artists`, `releases`, `events`, `posts`
- `radio_shows`, `radio_tracks`, `playlists`, `videos`
- `contacts`, `newsletter_subscribers`, `careers`, `career_applications`
- `tours`, `tour_dates`, `static_pages`, `testimonials`
- `team_members`, `radio_settings`

### Step 4: Understanding Row Level Security (RLS)

The schema includes RLS policies that control data access:

**Public Read Access** (no authentication required):
- Published artists, releases, events, posts
- Published radio shows, playlists, videos
- Static pages (terms, privacy, cookies)
- Published tours and tour dates
- Published testimonials and press assets
- Site settings
- Radio settings and tracks

**Public Write Access**:
- Contact form submissions
- Newsletter subscriptions
- Career applications
- Analytics tracking (page views, events, radio sessions)

**Authenticated Write Access** (admin login required):
- Create, update, delete any content
- Manage unpublished/draft content
- View contact submissions and applications
- Manage all site settings

To add full admin access policies, run this SQL in Supabase SQL Editor after running the main schema:

```sql
-- Admin policies (requires user with role='admin' in user metadata)
-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Artists admin policies
CREATE POLICY "Admins can insert artists" ON artists FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update artists" ON artists FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete artists" ON artists FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all artists" ON artists FOR SELECT USING (is_admin());

-- Releases admin policies
CREATE POLICY "Admins can insert releases" ON releases FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update releases" ON releases FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete releases" ON releases FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all releases" ON releases FOR SELECT USING (is_admin());

-- Events admin policies
CREATE POLICY "Admins can insert events" ON events FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update events" ON events FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete events" ON events FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all events" ON events FOR SELECT USING (is_admin());

-- Posts admin policies
CREATE POLICY "Admins can insert posts" ON posts FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update posts" ON posts FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete posts" ON posts FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all posts" ON posts FOR SELECT USING (is_admin());

-- Radio shows admin policies
CREATE POLICY "Admins can insert radio_shows" ON radio_shows FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update radio_shows" ON radio_shows FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete radio_shows" ON radio_shows FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all radio_shows" ON radio_shows FOR SELECT USING (is_admin());

-- Radio tracks admin policies
CREATE POLICY "Admins can insert radio_tracks" ON radio_tracks FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update radio_tracks" ON radio_tracks FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete radio_tracks" ON radio_tracks FOR DELETE USING (is_admin());

-- Playlists admin policies
CREATE POLICY "Admins can insert playlists" ON playlists FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update playlists" ON playlists FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete playlists" ON playlists FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all playlists" ON playlists FOR SELECT USING (is_admin());

-- Videos admin policies
CREATE POLICY "Admins can insert videos" ON videos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update videos" ON videos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete videos" ON videos FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all videos" ON videos FOR SELECT USING (is_admin());

-- Contacts admin policies
CREATE POLICY "Admins can read contacts" ON contacts FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update contacts" ON contacts FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete contacts" ON contacts FOR DELETE USING (is_admin());

-- Radio settings admin policies
CREATE POLICY "Admins can update radio_settings" ON radio_settings FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can insert radio_settings" ON radio_settings FOR INSERT WITH CHECK (is_admin());

-- Careers admin policies
CREATE POLICY "Admins can insert careers" ON careers FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update careers" ON careers FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete careers" ON careers FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all careers" ON careers FOR SELECT USING (is_admin());

-- Career applications admin policies
CREATE POLICY "Admins can read career_applications" ON career_applications FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update career_applications" ON career_applications FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete career_applications" ON career_applications FOR DELETE USING (is_admin());

-- Tours admin policies
CREATE POLICY "Admins can insert tours" ON tours FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update tours" ON tours FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete tours" ON tours FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all tours" ON tours FOR SELECT USING (is_admin());

-- Tour dates admin policies
CREATE POLICY "Admins can insert tour_dates" ON tour_dates FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update tour_dates" ON tour_dates FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete tour_dates" ON tour_dates FOR DELETE USING (is_admin());

-- Static pages admin policies
CREATE POLICY "Admins can insert static_pages" ON static_pages FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update static_pages" ON static_pages FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete static_pages" ON static_pages FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all static_pages" ON static_pages FOR SELECT USING (is_admin());

-- Newsletter admin policies
CREATE POLICY "Admins can read newsletter_subscribers" ON newsletter_subscribers FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update newsletter_subscribers" ON newsletter_subscribers FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete newsletter_subscribers" ON newsletter_subscribers FOR DELETE USING (is_admin());

-- Testimonials admin policies
CREATE POLICY "Admins can insert testimonials" ON testimonials FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update testimonials" ON testimonials FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete testimonials" ON testimonials FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all testimonials" ON testimonials FOR SELECT USING (is_admin());

-- Press assets admin policies
CREATE POLICY "Admins can insert press_assets" ON press_assets FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update press_assets" ON press_assets FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete press_assets" ON press_assets FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read all press_assets" ON press_assets FOR SELECT USING (is_admin());

-- Site settings admin policies
CREATE POLICY "Admins can read site_settings" ON site_settings FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update site_settings" ON site_settings FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can insert site_settings" ON site_settings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can delete site_settings" ON site_settings FOR DELETE USING (is_admin());

-- Analytics admin policies
CREATE POLICY "Admins can read page_views" ON page_views FOR SELECT USING (is_admin());
CREATE POLICY "Admins can delete page_views" ON page_views FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read analytics_events" ON analytics_events FOR SELECT USING (is_admin());
CREATE POLICY "Admins can delete analytics_events" ON analytics_events FOR DELETE USING (is_admin());
CREATE POLICY "Admins can read radio_sessions" ON radio_sessions FOR SELECT USING (is_admin());
CREATE POLICY "Admins can delete radio_sessions" ON radio_sessions FOR DELETE USING (is_admin());
```

**Important Notes:**
- The `is_admin()` function checks if the authenticated user has `role: "admin"` in their user metadata
- Public read policies allow unauthenticated users to view published content
- Public write policies allow anyone to submit forms and track analytics
- Admin policies require authentication and the admin role for all management operations
- Ensure you create admin users with the correct metadata as described in the "Creating an Admin User" section

### Step 5: Enable UUID Extension

In Supabase SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Firebase Setup

Firebase Realtime Database powers the live radio features:
- Real-time listener count
- Live chat during shows
- Current session/track metadata
- Recently played tracks

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project**
3. Enter a project name (e.g., `grouptherapy-radio`)
4. Disable Google Analytics (optional)
5. Click **Create project**

### Step 2: Enable Realtime Database

1. In your Firebase project, go to **Build** → **Realtime Database**
2. Click **Create Database**
3. Select a location:
   - `europe-west1` for Europe
   - `us-central1` for United States
4. Start in **Test mode** (we'll set rules next)
5. Click **Enable**

### Step 3: Configure Database Rules

Go to **Realtime Database** → **Rules** tab and replace with:

```json
{
  "rules": {
    "radio": {
      "listeners": {
        ".read": true,
        ".write": true,
        ".indexOn": ["joinedAt", "active"]
      },
      "chat": {
        ".read": true,
        ".write": true,
        "$messageId": {
          ".validate": "newData.hasChildren(['username', 'message', 'timestamp']) && newData.child('username').isString() && newData.child('message').isString() && newData.child('message').val().length <= 500"
        }
      },
      "metadata": {
        ".read": true,
        ".write": true
      },
      "currentSession": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['id', 'showId', 'showName', 'audioUrl', 'startedAt', 'duration', 'isActive'])"
      },
      "recentlyPlayed": {
        ".read": true,
        ".write": true,
        "$trackId": {
          ".validate": "newData.hasChildren(['title', 'artist', 'playedAt'])"
        }
      }
    },
    ".info": {
      ".read": true
    }
  }
}
```

Click **Publish** to save the rules.

**Rules Explanation**:

| Path | Purpose |
|------|---------|
| `radio/listeners` | Tracks active listeners with automatic cleanup on disconnect |
| `radio/chat` | Live chat messages with username/message validation (max 500 chars) |
| `radio/metadata` | Current track info (title, artist, cover, live status) |
| `radio/currentSession` | Active radio session data (show info, audio URL, start time) |
| `radio/recentlyPlayed` | History of recently played tracks |
| `.info` | Firebase server time offset for synchronization |

### Step 4: Get Firebase Configuration

1. Click the **gear icon** → **Project settings**
2. Scroll to **Your apps** → click **Web** icon (`</>`)
3. Register your app with a nickname
4. Copy the configuration values:

```javascript
const firebaseConfig = {
  apiKey: "...",           // → VITE_FIREBASE_API_KEY
  authDomain: "...",       // → VITE_FIREBASE_AUTH_DOMAIN
  databaseURL: "...",      // → VITE_FIREBASE_DATABASE_URL (includes region!)
  projectId: "...",        // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "...",    // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...",// → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "..."             // → VITE_FIREBASE_APP_ID
};
```

5. Add these to your Replit Secrets

**Important**: The `databaseURL` must include your region (e.g., `europe-west1`, `us-central1`).

### Step 5: Verify Firebase Connection

After starting the app:
1. Navigate to the `/radio` page
2. Open browser DevTools → Console
3. Look for Firebase initialization messages
4. Test chat by sending a message

---

## Cloudinary Setup (Optional)

Cloudinary provides image optimization and CDN hosting for uploads.

### Step 1: Create Account

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to **Dashboard**
3. Copy your **Cloud name** → `VITE_CLOUDINARY_CLOUD_NAME`

### Step 2: Create Upload Preset

1. Go to **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `unsigned`
   - **Signing Mode**: Unsigned
   - **Folder**: `grouptherapy` (optional)
5. Save the preset
6. Set `VITE_CLOUDINARY_UPLOAD_PRESET=unsigned` in Secrets

---

## Running the Application

The application is already configured to run on Replit.

### Starting the Development Server

Click the **Run** button at the top of the Replit workspace. This will:
1. Install dependencies (automatically)
2. Start the Vite development server on port 5000
3. Open the webview

The application will be available at the URL shown in the Webview tab.

### Build for Production

To create a production build:

```bash
npm run build
```

The build output will be in `dist/public/`.

---

## Admin Access

### Creating an Admin User

1. Go to your **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add user**
3. Fill in:
   - **Email**: Your admin email
   - **Password**: Create a secure password
   - **Auto Confirm User**: Check this box
4. Click **Create user**
5. Click on the created user
6. Scroll to **User Metadata** and click **Edit**
7. Add the following JSON:
   ```json
   {
     "role": "admin"
   }
   ```
8. Click **Save**

### Accessing Admin Dashboard

1. Navigate to `/admin/login` in your application
2. Enter your admin email and password
3. You'll be redirected to `/admin` dashboard

### Admin Features

| Section | Description |
|---------|-------------|
| Dashboard | Analytics overview and quick stats |
| Artists | Manage artist profiles and biographies |
| Releases | Add/edit music releases and albums |
| Events | Event calendar management |
| Posts | News and blog content |
| Radio Shows | Schedule shows with audio uploads |
| Playlists | Curate playlists |
| Videos | Video content management |
| Tours | Tour dates and locations |
| Testimonials | Customer/fan testimonials |
| Press Kit | Press releases and media assets |
| Static Pages | Terms, Privacy, About pages |
| Contacts | View contact form submissions |
| Careers | Job postings and applications |
| Settings | Site configuration |

---

## Troubleshooting

### Supabase Issues

**"permission denied for table..."**
- RLS policies not configured correctly
- Re-run the schema SQL in SQL Editor
- Ensure UUID extension is enabled

**"Supabase is not configured"**
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Secrets
- Ensure no typos in the environment variable names
- Restart the Repl after adding secrets

### Firebase Issues

**"Firebase not configured"**
- Verify all `VITE_FIREBASE_*` environment variables are set in Secrets
- Check for empty strings in config values
- Restart the Repl

**"Permission denied"**
- Database rules not published
- Go to Realtime Database → Rules → Publish

**"Database not found"**
- `DATABASE_URL` missing region suffix
- Format: `https://project-default-rtdb.region.firebasedatabase.app`

### Radio Features Not Working

1. Verify Firebase environment variables in Secrets
2. Check browser console for errors
3. Ensure Realtime Database is enabled in Firebase
4. Verify database rules are published
5. Check that the radio stream URL is accessible

### Admin Login Issues

**"Invalid login credentials"**
- Check email/password are correct
- Verify user exists in Supabase Authentication
- Ensure user has `role: "admin"` in user metadata

**Cannot access admin pages**
- Confirm you're logged in
- Check user metadata includes admin role
- Clear browser cache and re-login

### Build Errors

**"Module not found"**
- Run `npm install` to ensure all dependencies are installed
- Check import paths are correct

**TypeScript errors**
- Run `npm run check` to see type errors
- Ensure `@types` packages are installed

---

## Firebase Free Tier Limits

| Resource | Limit |
|----------|-------|
| Stored data | 1 GB |
| Downloaded data | 10 GB/month |
| Simultaneous connections | 100 |

Monitor usage in Firebase Console → Usage tab.

## Supabase Free Tier Limits

| Resource | Limit |
|----------|-------|
| Database size | 500 MB |
| Storage | 1 GB |
| Monthly bandwidth | 5 GB |
| Auth users | 50,000 MAU |

Both free tiers are sufficient for development and small-scale production deployments.

---

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TanStack Query** - Server state management
- **Wouter** - Routing
- **Framer Motion** - Animations

### Backend & Services
- **Supabase** - PostgreSQL database, authentication
- **Firebase Realtime Database** - Real-time features
- **Cloudinary** - Media storage (optional)

### Key Features
- Server-side rendering ready
- Optimistic UI updates
- Real-time listener tracking
- Live chat functionality
- SEO optimization
- Responsive design
- Dark/Light theme support

---

## Deployment on Replit

This application is designed to run on Replit. To deploy:

1. Ensure all environment variables are set in Secrets
2. Click the **Run** button
3. Your application will be accessible via the Webview URL
4. For production deployment, consider using Replit Deployments for enhanced performance

---

## Support

For issues or questions:
1. Check this setup guide
2. Review the code comments in `client/src/lib/`
3. Check browser console for error messages
4. Verify all environment variables are correctly set
