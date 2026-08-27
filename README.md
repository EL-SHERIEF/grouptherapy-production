# GroupTherapy Records - Complete Project Documentation

A **production-ready music platform + admin CMS** built with modern web technologies. GroupTherapy is a full-featured digital ecosystem for an electronic music label, featuring a public-facing website with multiple content types, real-time radio streaming, comprehensive admin dashboard, and advanced artist management tools.

**Current Version:** 2.0.0  
**Last Updated:** January 28, 2026

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Public Website Components](#public-website-components)
- [Admin Dashboard Components](#admin-dashboard-components)
- [API & Services](#api--services)
- [Frontend Components](#frontend-components)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## Project Overview

GroupTherapy is a comprehensive platform for an electronic music label. It serves two main purposes:

### 1. **Public Website** (`/`)
A modern, engaging website where listeners discover music, artists, events, radio streams, and news. Features include:
- **Music Discovery**: Browse releases, artists, playlists
- **Radio Streaming**: Live radio with real-time listener tracking and chat
- **Events Management**: Upcoming shows, festivals, tours
- **Content**: News posts, videos, press materials
- **Community**: Awards voting, testimonials, artist profiles

### 2. **Admin Dashboard** (`/admin`)
A complete content management system for label staff to manage all platform content:
- **Content Management**: Create, edit, publish all content types
- **Analytics**: Track page views, play counts, listener metrics
- **Newsletter System**: Email campaigns with AI-generated content
- **Settings Management**: SEO, site-wide settings, email configuration

---

## 🎯 Key Features

### Music & Content Management
- **Release Management** - Multi-platform release distribution (Spotify, Apple Music, SoundCloud)
- **Artist Profiles** - Complete artist bios with social links and featured selection
- **Event Scheduling** - Full event management with venue details, maps, and ticket links
- **Playlist Management** - Spotify playlist integration and custom playlists
- **Video Integration** - YouTube and Vimeo video hosting with metadata
- **News & Blog** - Full blogging system with categories, tags, and featured content

### Radio & Streaming
- **Live Radio Player** - Global radio player with streaming support
- **Radio Shows** - Schedule shows by day/time with timezone support
- **Track History** - Real-time track playback history
- **Live Chat** - Firebase-powered real-time chat (optional)
- **Listener Tracking** - Real-time listener count and session management
- **Audio Uploads** - Support for large audio files (up to 500MB with chunked upload)

### Awards & Voting
- **Award System** - Create award categories with voting periods
- **Nominee Management** - Add artists, tracks, or any content as nominees
- **Voting Interface** - Professional voting UI with track preview
- **Vote Tracking** - Track votes per entry with winner announcement
- **Multi-Platform Support** - Link to Spotify, Apple Music, SoundCloud tracks

### Email & Communication
- **Newsletter System** - Subscriber management and campaign builder
- **Email Service Integration** - Support for SendGrid, Resend, AWS SES, SMTP
- **AI Content Generation** - Generate newsletter content with Gemini API
- **Contact Form** - Capture visitor inquiries with automatic routing
- **Career Applications** - Accept job applications with resume uploads

### Career & Tours
- **Job Postings** - Post open positions with full job descriptions
- **Tour Management** - Full tour scheduling with multiple venue dates
- **Tour Dates** - Individual tour date management with tickets
- **Application Tracking** - Review and manage career applications

### SEO & Performance
- **Meta Tag Management** - Global SEO settings with per-page overrides
- **Structured Data** - JSON-LD schema for Organization, MusicGroup, WebSite
- **Sitemap Generation** - Automatic sitemaps for all content types
- **Social Media Preview** - OG tags for rich previews on social platforms
- **Analytics Tracking** - Page view and interaction tracking

### Media Management
- **Image Uploads** - Cloudinary integration for image optimization
- **Video Uploads** - Support for video uploads and streaming
- **Audio Uploads** - Large audio file support with progress tracking
- **Responsive Images** - Automatic image optimization and sizing

### Admin Features
- **Dashboard** - KPIs, recent activity, quick actions
- **User Roles** - Admin, Editor, Contributor roles with permissions
- **Settings Panel** - Global site configuration
- **Analytics Charts** - Visual performance metrics
- **Content Preview** - Live preview before publishing
- **Bulk Operations** - Export, import, manage content in bulk

### Integrations
- **Spotify API** - Auto-fetch release and playlist metadata
- **Gemini AI** - AI content generation for posts and newsletters
- **Cloudinary** - Image and video hosting with optimization
- **Firebase** - Real-time database for radio features (optional)
- **Supabase** - PostgreSQL database and authentication

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI framework | 18.3.1 |
| **TypeScript** | Type safety | 5.6.3 |
| **Vite** | Build tool | 5.4.20 |
| **TailwindCSS** | Styling | 3.4.17 |
| **shadcn/ui** | Component library | Latest |
| **Framer Motion** | Animations | 11.13.1 |
| **TanStack Query** | Server state | 5.60.5 |
| **Wouter** | Routing | 3.3.5 |
| **React Hook Form** | Form handling | 7.55.0 |
| **Zod** | Validation | 3.24.2 |
| **Recharts** | Charting | 2.15.2 |

### Backend & Services
| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL DB, Auth, Storage |
| **Firebase** | Real-time database (optional) |
| **Google Gemini** | AI text generation (optional) |
| **Spotify API** | Metadata fetching (optional) |
| **Cloudinary** | Media hosting & optimization |
| **SendGrid/Resend/SES** | Email delivery |

### Database
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL** | Relational database |
| **Drizzle ORM** | Type-safe database queries |
| **Row Level Security** | Database security policies |

### Infrastructure
| Platform | Purpose |
|----------|---------|
| **Vercel** | Recommended hosting |
| **Netlify** | Alternative hosting |
| **Docker** | Containerization |

---

## 🏗 Architecture

### Application Structure

```
Request Flow:
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────────────┐
│   React SPA (Vite)  │
│   - Pages           │
│   - Components      │
│   - Hooks           │
└──────┬──────────────┘
       │ REST/GraphQL
       ▼
┌──────────────────────┐
│ Supabase (Backend)   │
│ - PostgreSQL DB      │
│ - Auth               │
│ - Storage            │
└──────┬───────────────┘
       │ External APIs
       ├─► Firebase (Real-time)
       ├─► Gemini API (AI)
       ├─► Spotify API
       └─► Cloudinary
```

### Data Flow

1. **Client Layer** (`client/src/`)
   - React components render UI
   - TanStack Query manages server state
   - Local state via React hooks
   - Wouter handles client-side routing

2. **Service Layer** (`client/src/lib/`)
   - `database.ts` - Supabase data access
   - `firebase.ts` - Real-time features
   - `gemini.ts` - AI content generation
   - `email-service.ts` - Email delivery
   - `cloudinary.ts` - Media uploads
   - Context providers for global state

3. **Backend** (Supabase)
   - PostgreSQL database
   - Row Level Security policies
   - Storage buckets for media
   - Authentication with Supabase Auth

4. **External Services**
   - **Firebase**: Real-time radio features
   - **Gemini**: AI-powered content
   - **Spotify**: Release metadata
   - **Cloudinary**: Media optimization

### State Management

- **Server State**: TanStack Query (caching, synchronization)
- **Global State**: React Context (Radio, Auth, Chat)
- **Local State**: React useState hooks
- **URL State**: Wouter location

### Authentication

- Supabase Auth with email/password
- Session stored in browser localStorage
- Protected routes check auth status
- Admin role enforced via RLS policies

---

## 📊 Database Schema

### Core Content Tables

#### **Artists** (`artists`)
Artist roster and profiles.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | text | Artist name |
| `slug` | text | URL slug (unique) |
| `bio` | text | Biography |
| `imageUrl` | text | Profile image |
| `spotifyArtistId` | text | Spotify reference |
| `socialLinks` | jsonb | Social media links |
| `featured` | boolean | Homepage feature flag |
| `createdAt` | timestamp | Creation date |

#### **Releases** (`releases`)
Music releases across all platforms.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Release title |
| `slug` | text | URL slug (unique) |
| `artistId` | UUID | Artist reference |
| `artistName` | text | Artist name (denormalized) |
| `coverUrl` | text | Album artwork |
| `releaseDate` | timestamp | Release date |
| `genres` | text[] | Genre tags |
| `type` | text | album/single/ep |
| `spotifyUrl` | text | Spotify link |
| `appleMusicUrl` | text | Apple Music link |
| `soundcloudUrl` | text | SoundCloud link |
| `previewUrl` | text | Preview audio |
| `featured` | boolean | Homepage feature |
| `featured_until` | timestamp | Feature expiry |
| `published` | boolean | Published status |
| `createdAt` | timestamp | Creation date |

#### **Events** (`events`)
Concerts, festivals, shows.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Event name |
| `slug` | text | URL slug (unique) |
| `description` | text | Event details |
| `venue` | text | Venue name |
| `address` | text | Street address |
| `city` | text | City |
| `country` | text | Country |
| `lat` | text | Latitude (map) |
| `lng` | text | Longitude (map) |
| `date` | timestamp | Start date/time |
| `endDate` | timestamp | End date/time |
| `imageUrl` | text | Event image |
| `ticketUrl` | text | Ticket link |
| `ticketPrice` | text | Price info |
| `capacity` | integer | Venue capacity |
| `rsvpCount` | integer | RSVP count |
| `artistIds` | text[] | Performing artists |
| `featured` | boolean | Homepage feature |
| `published` | boolean | Published status |
| `createdAt` | timestamp | Creation date |

#### **Posts** (`posts`)
News articles and blog posts.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Post title |
| `slug` | text | URL slug (unique) |
| `excerpt` | text | Summary |
| `content` | text | Full HTML content |
| `coverUrl` | text | Featured image |
| `category` | text | news/blog/announcement |
| `tags` | text[] | Topic tags |
| `authorId` | UUID | Author reference |
| `authorName` | text | Author name |
| `metaTitle` | text | SEO title |
| `metaDescription` | text | SEO description |
| `ogImageUrl` | text | Social preview image |
| `publishedAt` | timestamp | Publish date |
| `published` | boolean | Published status |
| `featured` | boolean | Homepage feature |
| `createdAt` | timestamp | Creation date |

#### **RadioShows** (`radio_shows`)
Scheduled radio shows and programs.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Show name |
| `slug` | text | URL slug (unique) |
| `description` | text | Show description |
| `hostName` | text | Host name |
| `hostBio` | text | Host biography |
| `hostImageUrl` | text | Host photo |
| `coverUrl` | text | Show artwork |
| `streamUrl` | text | Stream URL |
| `recordedUrl` | text | Recording URL |
| `dayOfWeek` | integer | 0=Sun, 6=Sat |
| `startTime` | text | HH:MM format |
| `endTime` | text | HH:MM format |
| `timezone` | text | Timezone name |
| `repeat24h` | boolean | 24-hour repeat |
| `isLive` | boolean | Currently live |
| `published` | boolean | Published status |
| `createdAt` | timestamp | Creation date |

#### **RadioTracks** (`radio_tracks`)
Track history and now-playing.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `showId` | UUID | Show reference |
| `title` | text | Track title |
| `artist` | text | Artist name |
| `album` | text | Album name |
| `coverUrl` | text | Album art |
| `duration` | integer | Duration in seconds |
| `soundcloudUrl` | text | SoundCloud link |
| `playedAt` | timestamp | Play timestamp |
| `createdAt` | timestamp | Creation date |

#### **Playlists** (`playlists`)
Custom and Spotify playlists.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Playlist name |
| `slug` | text | URL slug (unique) |
| `description` | text | Description |
| `coverUrl` | text | Playlist cover |
| `spotifyPlaylistId` | text | Spotify reference |
| `spotifyUrl` | text | Spotify link |
| `trackCount` | integer | Number of tracks |
| `featured` | boolean | Homepage feature |
| `published` | boolean | Published status |
| `createdAt` | timestamp | Creation date |

#### **Videos** (`videos`)
Music videos and video content.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Video title |
| `slug` | text | URL slug (unique) |
| `description` | text | Description |
| `thumbnailUrl` | text | Thumbnail image |
| `videoUrl` | text | Direct video URL |
| `youtubeId` | text | YouTube video ID |
| `vimeoId` | text | Vimeo video ID |
| `artistId` | UUID | Artist reference |
| `artistName` | text | Artist name |
| `duration` | text | Duration |
| `category` | text | music-video/live/etc |
| `featured` | boolean | Homepage feature |
| `published` | boolean | Published status |
| `createdAt` | timestamp | Creation date |

### Community & Engagement Tables

#### **Tours** (`tours`)
Artist tour information.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Tour name |
| `slug` | text | URL slug (unique) |
| `artistName` | text | Performing artist |
| `description` | text | Tour details |
| `imageUrl` | text | Tour poster |
| `startDate` | timestamp | Tour start |
| `endDate` | timestamp | Tour end |
| `currency` | text | Pricing currency |
| `published` | boolean | Published status |
| `createdAt` | timestamp | Creation date |

#### **Tour Dates** (`tour_dates`)
Individual tour venue dates.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `tourId` | UUID | Tour reference |
| `venue` | text | Venue name |
| `city` | text | City |
| `country` | text | Country |
| `date` | timestamp | Performance date |
| `ticketUrl` | text | Ticket purchase link |
| `ticketPrice` | text | Ticket price |
| `soldOut` | boolean | Sold out status |
| `createdAt` | timestamp | Creation date |

#### **Careers** (`careers`)
Job postings.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Job title |
| `slug` | text | URL slug (unique) |
| `department` | text | Department |
| `location` | text | Office location |
| `type` | text | full-time/contract/etc |
| `description` | text | Job description |
| `requirements` | text | Requirements |
| `responsibilities` | text | Job responsibilities |
| `benefits` | text | Benefits info |
| `salary` | text | Salary info |
| `published` | boolean | Published status |
| `createdAt` | timestamp | Creation date |

#### **Career Applications** (`career_applications`)
Job applications.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `careerId` | UUID | Job reference |
| `name` | text | Applicant name |
| `email` | text | Email |
| `phone` | text | Phone |
| `resumeUrl` | text | Resume file |
| `coverLetter` | text | Cover letter |
| `linkedinUrl` | text | LinkedIn profile |
| `portfolioUrl` | text | Portfolio link |
| `status` | text | new/reviewed/rejected |
| `createdAt` | timestamp | Creation date |

#### **Testimonials** (`testimonials`)
User testimonials and reviews.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | text | Testimonial author |
| `role` | text | Author role/title |
| `company` | text | Company name |
| `content` | text | Testimonial text |
| `imageUrl` | text | Author photo |
| `rating` | integer | Star rating (1-5) |
| `featured` | boolean | Homepage feature |
| `published` | boolean | Published status |
| `createdAt` | timestamp | Creation date |

#### **Awards** (`award_categories`, `award_periods`, `award_entries`, `award_votes`)
Awards and voting system.

**Award Categories** - Award types (Best Track, Best Artist, etc.)
**Award Periods** - Voting periods with dates and voting status
**Award Entries** - Nominees (artists, tracks, releases)
**Award Votes** - Individual user votes

### Communication Tables

#### **Newsletter Subscribers** (`newsletter_subscribers`)
Email subscriber list.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | text | Email address (unique) |
| `name` | text | Subscriber name |
| `active` | boolean | Subscription status |
| `preferences` | jsonb | Email preferences |
| `subscribedAt` | timestamp | Subscription date |
| `unsubscribedAt` | timestamp | Unsubscribe date |

#### **Newsletter Templates** (`newsletter_templates`)
Email template library.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | text | Template name |
| `subject` | text | Email subject line |
| `content` | text | HTML template |
| `createdAt` | timestamp | Creation date |
| `updatedAt` | timestamp | Last update |

#### **Newsletter Campaigns** (`newsletter_campaigns`)
Sent newsletter campaigns.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `subject` | text | Email subject |
| `content` | text | Email HTML |
| `recipients` | integer | Number of recipients |
| `sentAt` | timestamp | Send timestamp |
| `createdAt` | timestamp | Creation date |

#### **Contacts** (`contacts`)
Contact form submissions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | text | Submitter name |
| `email` | text | Email address |
| `subject` | text | Message subject |
| `message` | text | Message body |
| `category` | text | general/support/etc |
| `status` | text | new/reviewed/replied |
| `createdAt` | timestamp | Submission date |

### System & Analytics Tables

#### **Site Settings** (`site_settings`)
Global site configuration.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `heroTitle` | text | Homepage hero title |
| `heroSubtitle` | text | Hero subtitle |
| `contactEmail` | text | Contact email |
| `contactPhone` | text | Contact phone |
| `socialLinks` | jsonb | Social media links |
| `statsItems` | jsonb | Homepage statistics |

#### **SEO Settings** (`seo_settings`)
SEO configuration and meta tags.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `defaultTitle` | text | Default page title |
| `defaultDescription` | text | Meta description |
| `defaultKeywords` | text[] | Meta keywords |
| `ogImage` | text | Social preview image |
| `twitterHandle` | text | Twitter handle |
| `organizationSchema` | jsonb | JSON-LD schema |

#### **Static Pages** (`static_pages`)
Custom pages (Terms, Privacy, etc.).

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | text | Page title |
| `slug` | text | URL slug (unique) |
| `content` | text | Page content (Markdown) |
| `published` | boolean | Published status |
| `createdAt` | timestamp | Creation date |
| `updatedAt` | timestamp | Last update |

#### **Page Views** (`page_views`)
Analytics: page views.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `path` | text | URL path |
| `title` | text | Page title |
| `referrer` | text | HTTP referrer |
| `viewedAt` | timestamp | View timestamp |

#### **Play Counts** (`play_counts`)
Analytics: track plays.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `releaseId` | UUID | Release reference |
| `releaseTitle` | text | Release title |
| `playedAt` | timestamp | Play timestamp |

#### **Radio Listeners** (`radio_listeners`)
Analytics: radio listener sessions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `sessionId` | text | Session identifier |
| `startedAt` | timestamp | Session start |
| `endedAt` | timestamp | Session end |

---

## 🎨 Public Website Components

### Page Structure

#### **Home** (`/`)
Homepage with hero section, featured content, and marquee.
- **Hero Section**: Dynamic background, CTA button
- **Featured Releases**: Carousel of new releases
- **Featured Artists**: Artist showcase
- **Events Section**: Upcoming events
- **Radio Section**: Quick access to radio
- **Statistics**: KPIs (artists, releases, streams)
- **Newsletter Signup**: Email subscription

#### **Releases** (`/releases`, `/releases/:slug`)
Music release showcase and detail pages.
- **Release Index**: Grid of all releases with filters
- **Release Details**: Full album info, tracks, links to platforms
- **Spotify Integration**: Auto-fetched metadata
- **Platform Links**: Spotify, Apple Music, SoundCloud
- **Analytics**: Track outbound clicks

#### **Artists** (`/artists`, `/artists/:slug`)
Artist roster and profiles.
- **Artist Index**: Featured and all artists
- **Artist Profile**: Bio, image, social links
- **Releases**: Albums by artist
- **Videos**: Artist videos
- **Featured Selection**: Promoted artists on homepage

#### **Events** (`/events`, `/events/:slug`)
Event and concert listing.
- **Event Index**: Calendar and list view
- **Event Details**: Venue, date, artist lineup
- **Map Integration**: Venue location mapping
- **Ticket Links**: External ticket sales
- **Featured Events**: Homepage highlights
- **RSVP Tracking**: Attendance counting

#### **Radio** (`/radio`)
Live radio streaming and shows.
- **Global Player**: Always-accessible radio widget
- **Show Schedule**: Weekly radio show calendar
- **Now Playing**: Current track display
- **Listener Count**: Real-time listener statistics
- **Chat**: Live chat during broadcasts (Firebase)
- **Track History**: Recent tracks played
- **Show Details**: Host info, descriptions

#### **Videos** (`/videos`)
Video content library.
- **Video Grid**: All videos with thumbnails
- **YouTube/Vimeo Embeds**: Streaming support
- **Filtering**: By artist, category
- **Featured Videos**: Homepage highlights

#### **Playlists** (`/playlists`)
Spotify and custom playlists.
- **Playlist Grid**: All playlists
- **Spotify Integration**: Auto-fetch metadata
- **Track Count**: Display track info
- **Featured Playlists**: Homepage highlights

#### **Tours** (`/tours`)
Artist tour information.
- **Tour Listings**: All upcoming tours
- **Tour Details**: Dates, venues, ticket links
- **Tour Dates**: Per-date venue and ticket info
- **Map View**: All locations (optional)

#### **Careers** (`/careers`)
Job listings and applications.
- **Job Listings**: Open positions
- **Job Details**: Description, requirements, benefits
- **Application Form**: Apply with resume upload
- **Filter**: By department, location, type

#### **News/Posts** (`/news`, `/news/:slug`)
Blog and news articles.
- **Post Index**: Articles with excerpts
- **Post Details**: Full content with metadata
- **Categories**: Filter by topic
- **Tags**: Related content
- **Author Info**: Article attribution

#### **Press** (`/press`)
Press kit and media assets.
- **About Copy**: Label description
- **Press Assets**: Downloadable logos, photos
- **Team Member**: Staff directory
- **Media Kit**: Downloadable information

#### **Awards** (`/awards`)
Awards and voting system.
- **Active Voting**: Current award periods
- **Nominee Cards**: Vote for entries
- **Track Preview**: Listen before voting
- **Platform Links**: Spotify, Apple Music
- **Vote Tracking**: Your votes

#### **Static Pages** (`/terms`, `/privacy`, `/cookies`, `/about`, `/contact`)
Legal and informational pages.
- **Terms of Service**: Legal terms
- **Privacy Policy**: Data privacy
- **Cookie Policy**: Cookie usage
- **About**: Label information
- **Contact Form**: Get in touch

#### **Promotions** (`/promote-your-release`, `/promote-your-event`)
Artist promotion pages.
- **Release Submission**: Submit releases for promotion
- **Event Promotion**: Submit events
- **Forms**: Collect artist info and details
- **Guidelines**: Submission requirements

---

## 🛠 Admin Dashboard Components

### Dashboard Sections

#### **Admin Home** (`/admin`)
Dashboard with KPIs and quick actions.
- **Key Metrics**: Page views, plays, listeners, revenue
- **Activity Feed**: Recent actions and updates
- **Quick Actions**: Create new content buttons
- **Charts**: Visual performance data
- **Recent Items**: Latest updates to content

#### **Artists Admin** (`/admin/artists`)
Full CRUD for artist management.
- **Artist List**: All artists with status
- **Create/Edit Form**: Name, bio, image, social links
- **Featured Toggle**: Homepage feature selection
- **Delete with Confirmation**: Safe deletion
- **Search & Filter**: Find artists quickly
- **Bulk Actions**: Select multiple, edit together
- **Spotify Integration**: Fetch artist metadata

#### **Releases Admin** (`/admin/releases`, `/admin/releases/:id`)
Release management with metadata.
- **Release List**: All releases with stats
- **Create/Edit Form**: Title, artist, dates, genres
- **Cover Upload**: Image uploader
- **Platform Links**: Spotify, Apple Music, SoundCloud
- **Featured Toggle**: Featured status and expiry
- **Spotify Fetch**: Auto-populate from Spotify URL
- **Preview URL**: Preview track playback
- **Status**: Published/draft
- **Date Picker**: Release date selection
- **Genre Tags**: Multi-select genres

#### **Events Admin** (`/admin/events`, `/admin/events/:id`)
Event and concert management.
- **Event List**: All events with date and featured status
- **Create/Edit Form**: Title, description, venue details
- **Location Fields**: Address, city, country
- **Map Coordinates**: Latitude/longitude input
- **Date/Time Picker**: Event dates
- **Image Upload**: Event poster
- **Ticket Info**: Price, URL, capacity
- **Artist Selection**: Assign performing artists
- **Featured Toggle**: Homepage feature
- **Status**: Published/draft

#### **Posts Admin** (`/admin/posts`, `/admin/posts/:id`)
News and blog post management.
- **Post List**: All posts with author, status
- **Create/Edit Form**: Title, excerpt, content
- **Rich Editor**: Markdown editor with preview
- **Cover Image**: Featured image upload
- **Category Selection**: news, blog, announcement
- **Tags**: Multi-tag system
- **Author Info**: Author name assignment
- **SEO Fields**: Meta title, description, OG image
- **Publish Date**: Scheduling (optional)
- **Featured Toggle**: Homepage feature
- **AI Generation**: Generate content with Gemini
- **Draft/Publish**: Status control

#### **Videos Admin** (`/admin/videos`)
Video content management.
- **Video List**: All videos with thumbnails
- **Create/Edit Form**: Title, description
- **Video Hosting**: YouTube ID, Vimeo ID, direct URL
- **Thumbnail Upload**: Custom thumbnail
- **Artist Assignment**: Link to artists
- **Category**: music-video, live, interview, etc.
- **Duration**: Track length
- **Featured Toggle**: Homepage feature
- **Status**: Published/draft

#### **Playlists Admin** (`/admin/playlists`)
Playlist management and curation.
- **Playlist List**: All playlists
- **Create/Edit Form**: Title, description
- **Spotify Integration**: Fetch playlist metadata
- **Cover Upload**: Playlist artwork
- **Track Count**: Display track info
- **Spotify ID**: Direct Spotify link
- **Featured Toggle**: Homepage feature
- **Status**: Published/draft

#### **Radio Shows Admin** (`/admin/radio-shows`)
Radio show scheduling and management.
- **Show List**: All radio shows
- **Create/Edit Form**: Show details
- **Host Info**: Host name, bio, photo
- **Stream URL**: Streaming link
- **Recording URL**: Archived recordings
- **Schedule**: Day of week, start/end time, timezone
- **24h Repeat**: Toggle continuous playback
- **Live Status**: Currently broadcasting toggle
- **Status**: Published/draft

#### **Tours Admin** (`/admin/tours`)
Tour and tour date management.
- **Tour List**: All tours
- **Create/Edit Form**: Tour info
- **Artist Assignment**: Touring artist
- **Dates**: Start and end dates
- **Image**: Tour poster
- **Tour Dates Sub-table**: Manage individual dates
- **Per-Date**: Venue, city, country, ticket link/price
- **Sold Out Toggle**: Mark sold-out shows
- **Status**: Published/draft

#### **Careers Admin** (`/admin/careers`)
Job posting management.
- **Job List**: All positions
- **Create/Edit Form**: Job details
- **Position Info**: Title, department, location
- **Employment Type**: Full-time, contract, etc.
- **Description**: Job description
- **Requirements**: Required skills/experience
- **Benefits**: Perks and benefits
- **Salary**: Salary information
- **Status**: Published/draft
- **Applications Tab**: View and manage applications

#### **Press Kit Admin** (`/admin/press-kit`)
Press assets and media management.
- **Asset List**: Logos, photos, documents
- **Upload Form**: File upload with metadata
- **Category**: Press asset type
- **Description**: Asset information
- **File Info**: Type, size, URL
- **Publish Toggle**: Control visibility
- **Bulk Download**: Export press kit

#### **Static Pages Admin** (`/admin/static-pages`)
Custom page management.
- **Page List**: All static pages
- **Create/Edit Form**: Page content
- **Markdown Editor**: Full page content
- **URL Slug**: Page path
- **Title**: Page title
- **Published Toggle**: Visibility control
- **Live Preview**: See rendered page

#### **Testimonials Admin** (`/admin/testimonials`)
User testimonial management.
- **Testimonial List**: All testimonials
- **Create/Edit Form**: Testimonial content
- **Author Info**: Name, role, company
- **Photo Upload**: Author avatar
- **Rating**: 1-5 star rating
- **Featured Toggle**: Homepage feature
- **Status**: Published/draft

#### **Awards Admin** (`/admin/awards`)
Awards system management.
- **Categories Tab**: Create award types
- **Periods Tab**: Create voting periods with dates
- **Entries Tab**: Add nominees (artists or tracks)
- **Votes Tab**: View and manage votes
- **Winner Selection**: Mark winners
- **Voting Control**: Open/close voting periods
- **Entry Details**: Full metadata for nominees
- **Track Audio**: Preview track nominees

#### **Contacts Admin** (`/admin/contacts`)
Contact form submissions.
- **Submission List**: All contact requests
- **Status Tracking**: new, reviewed, replied
- **Details View**: Full message content
- **Mark as Reviewed**: Change status
- **Reply Email**: Draft response
- **Export**: Backup submissions
- **Filter**: By status, date range

#### **Newsletter Admin** (`/admin/newsletters`)
Email marketing and campaigns.
- **Subscriber List**: Email list export
- **New Campaign Form**: Create newsletter
- **Template Selection**: Use templates
- **Recipient Selection**: Active subscribers
- **Content Editor**: HTML/Markdown editor
- **AI Generation**: Generate content with Gemini
- **Preview**: Email preview
- **Send Controls**: Schedule or send immediately
- **Campaign History**: Past campaigns
- **Subscriber Management**: Add, remove, export

#### **SEO Settings** (`/admin/seo-settings`)
Global SEO configuration.
- **Meta Tags**: Default title, description, keywords
- **Social Preview**: OG image, Twitter card
- **Social Accounts**: Twitter handle, Instagram, etc.
- **Structured Data**: JSON-LD schema editor
- **Sitemap Config**: Control sitemap generation
- **Robots.txt**: Customize robot rules

#### **Settings** (`/admin/settings`)
General application settings.
- **Email Configuration**: Choose email service
- **Email Service**: SendGrid, Resend, SES, SMTP
- **API Keys**: Service credentials
- **From Address**: Default sender email
- **Site Info**: Name, description
- **Hero Content**: Homepage hero text
- **Contact Details**: Company contact info
- **Social Links**: Social media profiles
- **Analytics**: Tracking configuration

---

## 🔌 API & Services

### Supabase Integration

#### Database Access (`client/src/lib/database.ts`)
Centralized data layer for all database operations.

**Key Functions:**
- `db.artists.*` - Artist CRUD
- `db.releases.*` - Release management
- `db.events.*` - Event management
- `db.posts.*` - Post management
- `db.videos.*` - Video management
- `db.playlists.*` - Playlist management
- `db.tours.*` - Tour management
- `db.careers.*` - Job management
- `db.awards.*` - Awards and voting
- `db.newsletter.*` - Newsletter management
- `db.contacts.*` - Contact submissions
- `db.analytics.*` - Analytics tracking
- `db.auth.*` - Authentication
- `db.seoSettings.*` - SEO configuration

**Example Usage:**
```typescript
// Fetch releases
const { data, error } = await db.releases.getAll();

// Get single release with detail
const release = await db.releases.getBySlug('my-release');

// Create new release
const newRelease = await db.releases.create({
  title: 'New Album',
  artistName: 'Artist Name',
  releaseDate: new Date(),
  // ...
});

// Update release
await db.releases.update(id, { featured: true });

// Delete release
await db.releases.delete(id);
```

### Firebase Integration (Optional)

Real-time features for radio streaming.

#### Features:
- **Listener Count**: Real-time listener statistics
- **Current Track**: Now-playing information
- **Live Chat**: Real-time messaging during streams
- **Session Tracking**: Track listener sessions
- **Metadata Updates**: Push current show/track updates

#### Configuration (firebase.ts):
```typescript
// Subscribe to listener count
const unsubscribe = subscribeToListenerCount((count) => {
  console.log('Listeners:', count);
});

// Subscribe to current track
subscribeToRadioMetadata((metadata) => {
  setCurrentTrack(metadata);
});

// Track listener session
trackListener(sessionId);
```

### Gemini AI Integration (Optional)

AI-powered content generation.

#### Features:
- **Post Generation**: Auto-generate blog post content
- **Newsletter Content**: Create newsletter text
- **Product Descriptions**: Generate release descriptions
- **Rate Limiting**: Built-in request queuing and throttling
- **Multiple API Keys**: Support for key rotation

#### Configuration (gemini.ts):
```typescript
// Check if configured
if (isGeminiConfigured()) {
  // Generate content
  const content = await generateContent(
    'Write a blog post about electronic music production...'
  );
}
```

### Spotify API Integration (Optional)

Fetch metadata and links from Spotify.

#### Features:
- **Album Metadata**: Auto-fetch release info
- **Playlist Metadata**: Get playlist details
- **Artist Info**: Fetch artist metadata
- **Preview URLs**: Get track preview links

#### Configuration (lib):
```typescript
// Fetch release metadata from Spotify URL
const metadata = await fetchSpotifyMetadata('spotify:album:123...');

// Returns: cover, release date, genres, tracks, etc.
```

### Cloudinary Integration (Optional)

Media hosting and optimization.

#### Features:
- **Image Uploads**: Automatic optimization and responsive sizing
- **Video Uploads**: Video hosting and streaming
- **Audio Uploads**: Large audio file support (up to 500MB)
- **Progress Tracking**: Upload progress callbacks
- **Chunked Upload**: For large files

#### Configuration (cloudinary.ts):
```typescript
// Upload image
const { secure_url } = await uploadImage(imageFile, {
  folder: 'grouptherapy',
  onProgress: (progress) => console.log(progress)
});

// Upload audio (with chunking for large files)
const result = await uploadAudio(audioFile, {
  onProgress: (progress) => console.log(progress)
});
```

### Email Service Integration

Multiple email provider support.

#### Supported Providers:
1. **SendGrid** - Enterprise email service
2. **Resend** - Developer-friendly email API
3. **AWS SES** - Amazon's email service
4. **SMTP** - Standard email protocol

#### Configuration (email-service.ts):
```typescript
// Configure email service
setEmailConfig({
  service: 'sendgrid',
  apiKey: 'your-api-key',
  fromEmail: 'noreply@example.com'
});

// Send email
await sendEmail({
  to: ['subscriber@example.com'],
  subject: 'Newsletter Subject',
  html: '<html>Email content</html>'
});
```

---

## 🧩 Frontend Components

### Core Components

#### **Navigation** (navigation.tsx)
Main site navigation bar.
- Desktop menu with dropdowns
- Mobile hamburger menu
- Theme toggle button
- Admin link (when logged in)

#### **Radio Player** (radio-player.tsx)
Global radio player widget.
- Play/pause controls
- Volume slider
- Progress bar
- Current track display
- Listener count
- Show schedule
- Mini and expanded modes
- Chat access

#### **Footer** (`footer.tsx`)
Site footer with links and info.
- Social media links
- Navigation links
- Contact information
- Newsletter signup
- Copyright

### Content Carousels

#### **Releases Carousel** (`releases-carousel.tsx`)
Scrollable release showcase.
- Auto-scroll or manual controls
- Featured releases
- Click to navigate to detail
- Responsive layout

#### **Artists Carousel** (`artists-carousel.tsx`)
Featured artists showcase.
- Auto-scroll
- Artist images with names
- Click to artist detail
- Loading states

#### **Events Carousel** (`events-carousel.tsx`)
Upcoming events carousel.
- Featured events
- Date and venue
- Click to detail page
- Mobile responsive

#### **Playlists Carousel** (`playlists-section.tsx`)
Featured playlists.
- Playlist covers
- Track count
- Navigate to detail
- Embeds for Spotify

#### **Posts Carousel** (`posts-carousel.tsx`)
Latest news/blog posts.
- Post preview with excerpt
- Featured image
- Category tag
- Click to full post

### Feature Components

#### **Hero Section** (`hero-section.tsx`)
Homepage hero banner.
- Customizable background image/video
- Dynamic title and subtitle
- Call-to-action button
- Animation effects

#### **Marquee** (`marquee.tsx`)
Scrolling text animation.
- Continuous scrolling text
- Stats and information
- Infinite loop

#### **Event Countdown** (`event-countdown.tsx`)
Countdown timer for events.
- Days, hours, minutes, seconds
- Event details
- Ticket button

#### **Comments Section** (`comments-section.tsx`)
Post/page comments (if enabled).
- Comment listing
- Reply functionality
- User avatars
- Timestamp

#### **Newsletter Section** (`newsletter-section.tsx`)
Email subscription form.
- Email input
- Form validation
- Success message
- Error handling

### UI Components (shadcn/ui)

All standard UI components from shadcn/ui library:
- Buttons
- Inputs and forms
- Cards
- Dialogs
- Dropdowns
- Modals
- Tables
- Sliders
- Tooltips
- And many more...

### Media Upload Components

#### **Image Upload** (`image-upload.tsx`)
File input for images.
- Drag and drop
- File preview
- Progress tracking
- Error handling
- Cloudinary integration

#### **Audio Upload** (`audio-upload.tsx`)
File input for audio.
- Large file support (500MB+)
- Chunked upload
- Progress display
- Duration tracking

#### **Video Upload** (`video-upload.tsx`)
File input for videos.
- Multiple hosting options
- Progress tracking
- Thumbnail preview
- Duration extraction

### Form Components

#### **Markdown Editor** (`markdown-editor.tsx`)
Rich text editor for content.
- Markdown syntax support
- Live preview
- Toolbar with formatting buttons
- Code highlighting
- Table support

#### **AI Autofill Button** (`ai-autofill-button.tsx`)
AI-powered content suggestions.
- Click to generate content
- Loading state
- Gemini integration
- Content insertion

#### **Newsletter Campaign Builder** (`newsletter-campaign-builder.tsx`)
Create and send newsletters.
- Template selection
- Content editor
- Recipient selection
- Preview
- Send scheduling

#### **Newsletter Template Builder** (`newsletter-template-builder.tsx`)
Design email templates.
- Visual editor
- Component blocks
- Preview across devices
- Save and reuse

### Analytics Components

#### **Analytics Chart** (`analytics-chart.tsx`)
Visual data representation.
- Line charts
- Bar charts
- Data over time
- Interactive legend

#### **Metrics Chart** (`metrics-chart.tsx`)
Key performance indicators.
- Card layout
- Icon display
- Current value
- Trend indicator

#### **Performance Monitor** (`performance-monitor.tsx`)
Real-time performance metrics.
- Page load time
- API response time
- Error rates
- Resource usage

### Authentication Components

#### **Protected Route** (`protected-route.tsx`)
Admin route protection.
- Check auth status
- Redirect to login if not authenticated
- Show loading while checking
- Pass user to route

#### **Auth Context** (`auth-context.tsx`)
Authentication state management.
- Login/logout
- User session
- Role checking
- Token management

### Chat Components

#### **Radio Chat** (`radio-chat.tsx`)
Real-time chat during radio streams.
- Message display
- New message input
- User list
- Firebase integration
- Auto-scroll to latest

#### **Chat Full Mode** (`chat-full-mode.tsx`)
Expanded chat interface.
- Full-screen chat
- User avatars
- Timestamps
- Message reactions

#### **Chat Mini Notification** (`chat-mini-notification.tsx`)
Floating chat notification.
- Show new message count
- Quick preview
- Click to expand
- Collapse button

### SEO Components

#### **SEO Head** (`seo-head.tsx`)
Meta tag injection.
- Dynamic title
- Meta description
- OG tags
- Twitter card
- Structured data
- Canonical URLs

### Theme Components

#### **Theme Toggle** (`theme-toggle.tsx`)
Dark/light mode switcher.
- Toggle button
- Save preference
- Apply theme
- System preference fallback

---

## 💾 Installation & Setup

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **Supabase Account** ([sign up free](https://supabase.com/))
- **Git** for version control

### Step 1: Clone Repository

```bash
git clone https://github.com/egypcoder/grouptherapy-production.git
cd grouptherapy-production
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

If no example exists, create it manually with the required variables (see Environment Variables).

### Step 4: Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com/)
2. Get your credentials from Project Settings → API
3. Update `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Step 5: Run Database Migrations

In Supabase SQL Editor, run these in order:

1. db-schema-fixed.sql - Core schema
2. migration-new-tables.sql - Additional tables
3. migration-email-service-config.sql - Email config (optional)

### Step 6: Start Development Server

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

### Step 7: Access Admin Dashboard

1. Go to [http://localhost:5000/admin](http://localhost:5000/admin)
2. Sign up or log in with Supabase credentials
3. Start managing content!

---

## 🔐 Environment Variables

### Required Variables

```bash
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Optional: Firebase (Real-time Radio)

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Optional: Gemini AI

```bash
# Single API key
VITE_GEMINI_API_KEY=your_api_key

# Or multiple keys for load balancing
VITE_GEMINI_API_KEY_1=
VITE_GEMINI_API_KEY_2=
VITE_GEMINI_API_KEY_3=
```

### Optional: Spotify API

```bash
VITE_SPOTIFY_CLIENT_ID=
VITE_SPOTIFY_CLIENT_SECRET=
```

### Optional: Cloudinary

```bash
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### Optional: Email Services

**SendGrid:**
```bash
VITE_EMAIL_SERVICE=sendgrid
VITE_SENDGRID_API_KEY=
VITE_EMAIL_FROM=noreply@example.com
```

**Resend:**
```bash
VITE_EMAIL_SERVICE=resend
VITE_RESEND_API_KEY=
VITE_EMAIL_FROM=noreply@example.com
```

**AWS SES:**
```bash
VITE_EMAIL_SERVICE=ses
VITE_SES_API_URL=
VITE_EMAIL_FROM=noreply@example.com
```

**SMTP:**
```bash
VITE_EMAIL_SERVICE=smtp
VITE_EMAIL_API_URL=
VITE_EMAIL_FROM=noreply@example.com
```

---

## 🚀 Deployment

### Vercel (Recommended)

Easiest deployment for React/Vite apps.

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

Add environment variables in Vercel dashboard → Settings → Environment Variables.

### Netlify

Alternative serverless hosting.

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### Docker

For self-hosted deployment.

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "run", "preview"]
```

Build and run:
```bash
docker build -t grouptherapy .
docker run -p 5000:5000 --env-file .env grouptherapy
```

---

## 📁 Project Structure

```
grouptherapy-production/
├── client/                          # React frontend
│   ├── src/
│   │   ├── App.tsx                 # Main routing
│   │   ├── main.tsx                # Entry point
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── radio-player.tsx    # Global radio player
│   │   │   ├── navigation.tsx      # Site nav
│   │   │   ├── footer.tsx          # Site footer
│   │   │   ├── *-carousel.tsx      # Content carousels
│   │   │   ├── *-upload.tsx        # File uploaders
│   │   │   ├── admin/              # Admin-only components
│   │   │   └── ...
│   │   ├── pages/                  # Route pages
│   │   │   ├── home.tsx            # Homepage
│   │   │   ├── releases.tsx        # Releases page
│   │   │   ├── artists.tsx         # Artists page
│   │   │   ├── events.tsx          # Events page
│   │   │   ├── radio.tsx           # Radio page
│   │   │   ├── news.tsx            # News index
│   │   │   ├── admin/              # Admin pages
│   │   │   │   ├── index.tsx       # Admin dashboard
│   │   │   │   ├── releases.tsx    # Release admin
│   │   │   │   ├── artists.tsx     # Artist admin
│   │   │   │   ├── events.tsx      # Event admin
│   │   │   │   ├── posts.tsx       # Post admin
│   │   │   │   ├── newsletters.tsx # Newsletter admin
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── lib/                    # Utility functions
│   │   │   ├── database.ts         # Supabase data layer
│   │   │   ├── firebase.ts         # Firebase integration
│   │   │   ├── gemini.ts           # AI content generation
│   │   │   ├── cloudinary.ts       # Media uploads
│   │   │   ├── email-service.ts    # Email sending
│   │   │   ├── auth-context.tsx    # Auth state
│   │   │   ├── radio-context.tsx   # Radio state
│   │   │   ├── chat-context.tsx    # Chat state
│   │   │   ├── queryClient.ts      # TanStack Query config
│   │   │   └── ...
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── use-carousel-autoplay.ts
│   │   │   ├── use-toast.ts
│   │   │   └── ...
│   │   └── index.css               # Global styles
│   ├── public/                     # Static assets
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── index.html                  # HTML template
│   └── package.json
│
├── shared/                         # Shared code
│   └── schema.ts                   # Database schema (Drizzle)
│
├── api/                            # API routes (SSR)
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── seo.ts
│   ├── newsletter-sender-profiles.ts
│   └── ...
│
├── docs/                           # Documentation
│   ├── db-schema-fixed.sql         # Database schema
│   ├── migration-new-tables.sql    # New tables
│   ├── migration-steps.md          # Setup instructions
│   └── ...
│
├── vite.config.ts                  # Vite configuration
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
├── README.md                        # Project documentation
├── CHANGELOG.md                    # Version history
├── DEPLOYMENT.md                   # Deployment guide
└── .env.example                    # Environment template
```

---

## 🐛 Troubleshooting

### "Supabase connection failed"

**Problem:** Cannot connect to Supabase  
**Solution:**
1. Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
2. Verify project is running in Supabase dashboard
3. Check internet connection
4. Clear browser cache and restart dev server

### "Column not found" errors

**Problem:** Database migration not applied  
**Solution:**
1. Run all SQL migrations in order:
   - db-schema-fixed.sql
   - migration-new-tables.sql
   - Any other migrations
2. Verify all tables exist in Supabase
3. Check Row Level Security policies are set correctly

### AI content generation not working

**Problem:** "Gemini API not configured"  
**Solution:**
1. Get API key from [Google AI Studio](https://aistudio.google.com/)
2. Add `VITE_GEMINI_API_KEY` to `.env`
3. Restart dev server
4. Try again

### Upload fails with "413 Payload Too Large"

**Problem:** File too large to upload  
**Solution:**
1. Check file size (max 500MB for audio)
2. Use chunked upload (`uploadAudio` instead of `uploadImage`)
3. Contact Cloudinary support for limit increase
4. Use streaming upload for very large files

### Radio player not working

**Problem:** Radio won't play  
**Solution:**
1. Check stream URL is correct in radio settings
2. Verify stream is accessible (test in browser)
3. Check browser security (CORS, HTTPS)
4. Try alternative stream URL
5. Check browser console for errors

### Firebase features not available

**Problem:** Chat and listener count missing  
**Solution:**
1. Firebase is optional - app works without it
2. If needed, add Firebase environment variables
3. Set up Firebase project
4. Enable Realtime Database
5. Deploy Firebase security rules
6. Restart app

### Email sending fails

**Problem:** Newsletters don't send  
**Solution:**
1. Check email service is configured (Settings → Email)
2. Verify API key is correct
3. Check recipient list has valid emails
4. Try test email to your own address
5. Check email service dashboard for errors
6. Verify "from" email is configured

### TypeScript errors

**Problem:** TS compilation fails  
**Solution:**
```bash
# Type check
npm run check

# Fix TypeScript
npm install --save-dev typescript

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Build fails

**Problem:** `npm run build` fails  
**Solution:**
```bash
# Clear cache
npm run clean  # or manually delete dist/ and node_modules/

# Reinstall
npm install

# Try build again
npm run build

# Check for errors in output
```

### Port already in use

**Problem:** Port 5000 already in use  
**Solution:**
```bash
# Kill process using port
lsof -ti:5000 | xargs kill -9

# Or start on different port
npm run dev -- --port 3000
```

---

## 📞 Support & Contact

### Project Information
- **Name:** GroupTherapy Records
- **Version:** 2.0.0
- **Type:** Music Platform + Admin CMS
- **Status:** Production Ready

### Contact
- **Email:** osama@grouptherapyeg.com
- **GitHub:** https://github.com/egypcoder/grouptherapy-production
- **Issues:** GitHub Issues for bug reports and feature requests

### Additional Resources
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **TailwindCSS:** https://tailwindcss.com
- **shadcn/ui:** https://ui.shadcn.com

### Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated:** January 28, 2026  
**Maintained by:** GroupTherapy Development Team
```

