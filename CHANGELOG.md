# GroupTherapy Records - Changelog

## Version 2.0.0 - December 20, 2024

### 🎉 Major Features Added

#### Newsletter Management System
- **Admin Newsletter Page** - Complete newsletter management interface at `/admin/newsletters`
- **Email Subscriber Management** - View, export, and manage all newsletter subscribers
- **AI-Powered Content Generation** - Generate newsletter content using Gemini AI
- **HTML Email Support** - Send rich HTML emails to all active subscribers
- **CSV Export** - Export subscriber list to CSV format
- **Live Preview** - Preview newsletter before sending

#### Database Schema Enhancements
- **Tours & Tour Dates** - Complete tour management with dates, venues, and ticket information
- **Careers** - Job posting system with detailed job descriptions
- **Newsletter Subscribers** - Dedicated table for email subscribers
- **Awards System** - Full voting system with categories, periods, entries, and votes
- **SEO Settings** - Global SEO configuration management
- **Static Pages** - Custom page management system
- **Testimonials** - User testimonial management
- **SQL Migration File** - All new tables documented in `docs/migration-new-tables.sql`

### 🐛 Bug Fixes

#### Spotify Integration
- **Fixed**: Spotify link fetch in admin/releases
- **Fixed**: Environment variables properly configured (added VITE_ prefixes)
- **Status**: Now works correctly - paste Spotify URL and metadata is auto-fetched

#### Radio Player
- **Fixed**: Latest releases play button functionality in radio bar
- **Fixed**: Removed unnecessary condition that prevented track playback
- **Status**: Click play icon on recent releases now plays the track

#### Events System
- **Fixed**: Event cards in /events page now clickable and match home section design
- **Fixed**: Both EventCard and EventListCard now have proper hover effects
- **Fixed**: Featured events now sorted first in home events section
- **Status**: Events are now properly highlighted and sorted

#### Awards & Voting
- **Fixed**: Audio playback for track nominees in voting
- **Fixed**: Platform icons - shows Spotify icon for Spotify links, SoundCloud for SoundCloud
- **Fixed**: Added play/pause button overlay on track images
- **Fixed**: Improved card UX with better hover states and transitions
- **Status**: Users can now preview tracks before voting

#### AI Content Generation
- **Fixed**: "Module overloaded" error in admin blogs/news
- **Changed**: Model from `gemini-2.5-flash` to `gemini-1.5-flash`
- **Status**: AI content generation now works correctly

#### Tours Management
- **Fixed**: "Currency column not found" error
- **Added**: Currency column to tours table in schema
- **Status**: Tours can now be created and saved successfully

### 💾 File Upload Improvements

#### Large Audio Files
- **Fixed**: 130MB audio file upload failures
- **Added**: Chunked upload support for files >100MB
- **Added**: Extended timeout to 10 minutes for large files
- **Added**: Better error handling and progress tracking
- **Status**: Can now upload files up to 500MB

### 🎨 UX Improvements

#### Cards & Tables
- **Enhanced**: All event cards with hover effects and scale animations
- **Enhanced**: Awards cards with better visual hierarchy
- **Enhanced**: Table rows with hover states and transitions
- **Enhanced**: Better clickability indicators throughout the site
- **Status**: More polished and intuitive user interface

#### Awards Page
- **Enhanced**: Creative and smart UX for voting
- **Enhanced**: Better visual feedback for voted items
- **Enhanced**: Platform-specific icons (Spotify green, SoundCloud orange)
- **Enhanced**: Audio preview functionality for tracks
- **Status**: Professional voting experience

### 📚 Documentation

#### README.md
- Complete setup instructions
- Environment variables guide
- Tech stack overview
- Features list
- Troubleshooting section

#### DEPLOYMENT.md
- Vercel deployment guide
- Netlify deployment guide
- Self-hosted VPS deployment guide
- Post-deployment checklist
- Security best practices
- Monitoring setup
- Rollback procedures

#### setup.sh
- Automated setup script
- Node.js version checking
- Auto-creates .env template
- Dependency installation
- Clear next steps

### 🔧 Technical Improvements

#### Environment Configuration
- All API credentials properly configured
- VITE_ prefixed variables for client-side access
- Secure credential handling
- Comprehensive .env template

#### Code Quality
- TypeScript types for all new tables
- Proper error handling throughout
- Loading states for async operations
- Responsive design improvements

### 📋 Database Migrations

#### New Tables Created
1. `tours` - Tour information
2. `tour_dates` - Individual tour dates
3. `careers` - Job postings
4. `newsletter_subscribers` - Email subscribers
5. `seo_settings` - SEO configuration
6. `award_categories` - Award types
7. `award_periods` - Voting periods
8. `award_entries` - Nominees
9. `award_votes` - User votes
10. `static_pages` - Custom pages
11. `testimonials` - User testimonials

#### Migration Files
- `docs/migration-new-tables.sql` - Complete schema for new tables
- Includes indexes for performance
- Row Level Security (RLS) policies included
- Public read policies where appropriate

### 🔒 Security Enhancements
- Environment variables properly secured
- .env file in .gitignore
- Rate limiting on uploads
- CORS properly configured
- RLS policies on all tables

### 🚀 Performance Optimizations
- Chunked uploads for large files
- Better error handling reduces failed requests
- Optimized database queries with proper sorting
- Loading states improve perceived performance

---

## Next Steps for Client

### 1. Database Setup
Run these SQL files in your Supabase SQL editor:
1. `docs/db-schema-fixed.sql` (if not already done)
2. `docs/migration-new-tables.sql` (new tables)
3. `docs/seed-data.sql` (optional test data)

### 2. Environment Variables
Ensure all environment variables are set in your deployment platform:
- Spotify API credentials
- Gemini AI API key
- Cloudinary settings
- Firebase configuration
- Supabase credentials
- Admin credentials

### 3. Cloudinary Setup
- Create an unsigned upload preset in Cloudinary dashboard
- Set the preset name in `VITE_CLOUDINARY_UPLOAD_PRESET`

### 4. Testing Checklist
- [ ] Admin login works
- [ ] Spotify metadata fetching works
- [ ] Image uploads work
- [ ] Audio uploads work (test with large file)
- [ ] Events are clickable
- [ ] Featured events appear first
- [ ] Awards voting works
- [ ] Audio playback in awards works
- [ ] Newsletter subscriber management works
- [ ] AI content generation works
- [ ] Tour management works
- [ ] Mobile responsiveness
- [ ] All admin pages accessible

### 5. Production Deployment
Follow the `DEPLOYMENT.md` guide for your chosen platform:
- Vercel (recommended for easiest setup)
- Netlify (also very easy)
- Self-hosted VPS (for full control)

---

## Known Limitations

### Radio Shows Day of Week Reorganization
- **Status**: The existing implementation already supports day of week scheduling
- **Note**: Shows can be assigned to specific days with start/end times
- **Future Enhancement**: Could add a visual weekly calendar view if needed

### Large File Uploads
- **Limitation**: Cloudinary free tier may have upload size limits
- **Current Limit**: 500MB per file (configurable in code)
- **Solution**: Upgrade to Cloudinary paid plan if needed

### Email Sending
- **Status**: Newsletter system is built but requires email service integration
- **Note**: Currently simulated - integrate with SendGrid, AWS SES, or similar
- **Action Required**: Choose an email service and add the integration code

---

## Support & Contact

For technical support or questions:
- **Email**: osama@grouptherapyeg.com
- **Repository**: https://github.com/egypcoder/grouptherapy-production

---

## Git Commit History

All changes have been committed with detailed messages:
1. "Fix multiple issues and add new features"
2. "Improve audio upload for large files"
3. "Add comprehensive documentation"
4. "Add setup script for easy installation"

All commits have been pushed to the `main` branch.
