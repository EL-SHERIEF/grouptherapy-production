import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Admin table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("contributor"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users table for authentication
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  email: text("email"),
  role: text("role").notNull().default("admin"), // admin, editor, contributor
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Login attempts tracking table
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  ipAddress: text("ip_address"),
  successful: boolean("successful").notNull(),
  attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
});

// Artists roster
export const artists = pgTable("artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  bio: text("bio"),
  imageUrl: text("image_url"),
  spotifyArtistId: text("spotify_artist_id"),
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    twitter?: string;
    spotify?: string;
    soundcloud?: string;
    youtube?: string;
  } | null>(),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Music releases
export const releases = pgTable("releases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  artistId: varchar("artist_id").references(() => artists.id),
  artistName: text("artist_name").notNull(),
  coverUrl: text("cover_url"),
  releaseDate: timestamp("release_date"),
  genres: text("genres").array(),
  spotifyAlbumId: text("spotify_album_id"),
  spotifyUrl: text("spotify_url"),
  appleMusicUrl: text("apple_music_url"),
  soundcloudUrl: text("soundcloud_url"),
  previewUrl: text("preview_url"),
  type: text("type").default("album"),
  featured: boolean("featured").default(false),
  featuredUntil: timestamp("featured_until"),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  venue: text("venue").notNull(),
  address: text("address"),
  city: text("city").notNull(),
  country: text("country").notNull(),
  lat: text("lat"),
  lng: text("lng"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  imageUrl: text("image_url"),
  ticketUrl: text("ticket_url"),
  ticketPrice: text("ticket_price"),
  capacity: integer("capacity"),
  rsvpCount: integer("rsvp_count").default(0),
  artistIds: text("artist_ids").array(),
  featured: boolean("featured").default(false),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blog posts / News
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  coverUrl: text("cover_url"),
  category: text("category").default("news"),
  tags: text("tags").array(),
  authorId: varchar("author_id").references(() => users.id),
  authorName: text("author_name"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImageUrl: text("og_image_url"),
  publishedAt: timestamp("published_at"),
  published: boolean("published").default(false),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Radio shows
export const radioShows = pgTable("radio_shows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  hostName: text("host_name").notNull(),
  hostBio: text("host_bio"),
  hostImageUrl: text("host_image_url"),
  coverUrl: text("cover_url"),
  streamUrl: text("stream_url"),
  recordedUrl: text("recorded_url"),
  dayOfWeek: integer("day_of_week"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  timezone: text("timezone").default("UTC"),
  repeat24h: boolean("repeat_24h").default(false),
  isLive: boolean("is_live").default(false),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Radio track history
export const radioTracks = pgTable("radio_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  showId: varchar("show_id").references(() => radioShows.id),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  coverUrl: text("cover_url"),
  duration: integer("duration"),
  soundcloudUrl: text("soundcloud_url"),
  playedAt: timestamp("played_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Playlists
export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  coverUrl: text("cover_url"),
  spotifyPlaylistId: text("spotify_playlist_id"),
  spotifyUrl: text("spotify_url"),
  trackCount: integer("track_count").default(0),
  featured: boolean("featured").default(false),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Videos
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  youtubeId: text("youtube_id"),
  vimeoId: text("vimeo_id"),
  artistId: varchar("artist_id").references(() => artists.id),
  artistName: text("artist_name"),
  duration: text("duration"),
  category: text("category").default("music-video"),
  featured: boolean("featured").default(false),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team members
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio"),
  imageUrl: text("image_url"),
  socialLinks: jsonb("social_links").$type<{
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  }>(),
  order: integer("order").default(0),
  published: boolean("published").default(true),
});

// Contact submissions
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  category: text("category").default("general"),
  attachmentUrl: text("attachment_url"),
  status: text("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Press kit / Media assets
export const pressAssets = pgTable("press_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").default("logo"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Radio station settings
export const radioSettings = pgTable("radio_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stationName: text("station_name").default("GroupTherapy Radio"),
  streamUrl: text("stream_url"),
  fallbackStreamUrl: text("fallback_stream_url"),
  currentTrack: text("current_track"),
  currentArtist: text("current_artist"),
  currentCoverUrl: text("current_cover_url"),
  currentShowName: text("current_show_name"),
  currentHostName: text("current_host_name"),
  isLive: boolean("is_live").default(false),
  listenerCount: integer("listener_count").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table for serverless authentication
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Analytics - Page views
export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  path: text("path").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  sessionId: text("session_id"),
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
});

// Analytics - Play counts for releases
export const playCounts = pgTable("play_counts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  releaseId: varchar("release_id").references(() => releases.id),
  playedAt: timestamp("played_at").notNull().defaultNow(),
  duration: integer("duration"),
  completed: boolean("completed").default(false),
  sessionId: text("session_id"),
});

// Analytics - Radio listeners
export const radioListeners = pgTable("radio_listeners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  showId: varchar("show_id").references(() => radioShows.id),
  sessionId: text("session_id"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"),
});

// Tours
export const tours = pgTable("tours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  artistName: text("artist_name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  currency: text("currency").default("USD"),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tour dates
export const tourDates = pgTable("tour_dates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: varchar("tour_id").references(() => tours.id),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  date: timestamp("date").notNull(),
  ticketUrl: text("ticket_url"),
  ticketPrice: text("ticket_price"),
  soldOut: boolean("sold_out").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Careers
export const careers = pgTable("careers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  type: text("type").default("full-time"),
  description: text("description"),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  benefits: text("benefits"),
  salary: text("salary"),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const careerApplications = pgTable("career_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  careerId: varchar("career_id").references(() => careers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  status: text("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Newsletter subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  source: text("source"),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  active: boolean("active").default(true),
});

export const newsletterTemplates = pgTable("newsletter_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  schemaVersion: integer("schema_version").notNull().default(1),
  isDefault: boolean("is_default").notNull().default(false),
  globalSettings: jsonb("global_settings").notNull().default({}),
  sections: jsonb("sections").notNull().default([]),
  assets: jsonb("assets").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterSenderProfiles = pgTable("newsletter_sender_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  service: text("service").notNull().default("none"),
  fromEmail: text("from_email").notNull(),
  senderName: text("sender_name"),
  apiUrl: text("api_url"),
  apiKeyEncrypted: text("api_key_encrypted"),
  apiKeyLast4: text("api_key_last4"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => newsletterTemplates.id),
  senderProfileId: varchar("sender_profile_id").references(() => newsletterSenderProfiles.id),
  subject: text("subject"),
  preheader: text("preheader"),
  content: jsonb("content").notNull().default({}),
  renderedHtml: text("rendered_html"),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SEO Settings
export const seoSettings = pgTable("seo_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  defaultTitle: text("default_title").notNull(),
  defaultDescription: text("default_description").notNull(),
  defaultKeywords: text("default_keywords").array(),
  ogImage: text("og_image"),
  twitterImage: text("twitter_image"),
  twitterHandle: text("twitter_handle"),
  organizationSchema: jsonb("organization_schema"),
  websiteSchema: jsonb("website_schema"),
  musicGroupSchema: jsonb("music_group_schema"),
  headScripts: text("head_scripts"),
  bodyScripts: text("body_scripts"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Award categories
export const awardCategories = pgTable("award_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  type: text("type").notNull(),
  period: text("period").notNull(),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Award periods
export const awardPeriods = pgTable("award_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => awardCategories.id),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  votingOpen: boolean("voting_open").default(false),
  winnerId: varchar("winner_id"),
  announcedAt: timestamp("announced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Award entries
export const awardEntries = pgTable("award_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").references(() => awardPeriods.id),
  artistId: varchar("artist_id").references(() => artists.id),
  artistName: text("artist_name"),
  artistImageUrl: text("artist_image_url"),
  artistBio: text("artist_bio"),
  trackTitle: text("track_title"),
  trackArtist: text("track_artist"),
  trackCoverUrl: text("track_cover_url"),
  trackAudioUrl: text("track_audio_url"),
  trackDuration: integer("track_duration"),
  spotifyUrl: text("spotify_url"),
  appleMusicUrl: text("apple_music_url"),
  soundcloudUrl: text("soundcloud_url"),
  voteCount: integer("vote_count").default(0),
  displayOrder: integer("display_order").default(0),
  isWinner: boolean("is_winner").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Award votes
export const awardVotes = pgTable("award_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").references(() => awardEntries.id),
  periodId: varchar("period_id").references(() => awardPeriods.id),
  userId: varchar("user_id"),
  voterIp: text("voter_ip"),
  voterEmail: text("voter_email"),
  fingerprint: text("fingerprint"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Static pages
export const staticPages = pgTable("static_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Testimonials
export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role"),
  company: text("company"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  rating: integer("rating").default(5),
  featured: boolean("featured").default(false),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertArtistSchema = createInsertSchema(artists).omit({ id: true, createdAt: true });
export const insertReleaseSchema = createInsertSchema(releases).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true });
export const insertRadioShowSchema = createInsertSchema(radioShows).omit({ id: true, createdAt: true });
export const insertRadioTrackSchema = createInsertSchema(radioTracks).omit({ id: true });
export const insertPlaylistSchema = createInsertSchema(playlists).omit({ id: true, createdAt: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, status: true });
export const insertPressAssetSchema = createInsertSchema(pressAssets).omit({ id: true, createdAt: true });
export const insertRadioSettingsSchema = createInsertSchema(radioSettings).omit({ id: true, updatedAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ createdAt: true });
export const insertPageViewSchema = createInsertSchema(pageViews).omit({ id: true, viewedAt: true });
export const insertPlayCountSchema = createInsertSchema(playCounts).omit({ id: true, playedAt: true });
export const insertRadioListenerSchema = createInsertSchema(radioListeners).omit({ id: true, startedAt: true });
export const insertTourSchema = createInsertSchema(tours).omit({ id: true, createdAt: true });
export const insertTourDateSchema = createInsertSchema(tourDates).omit({ id: true, createdAt: true });
export const insertCareerSchema = createInsertSchema(careers).omit({ id: true, createdAt: true });
export const insertCareerApplicationSchema = createInsertSchema(careerApplications).omit({ id: true, createdAt: true });
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, subscribedAt: true });
export const insertNewsletterTemplateSchema = createInsertSchema(newsletterTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSeoSettingsSchema = createInsertSchema(seoSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAwardCategorySchema = createInsertSchema(awardCategories).omit({ id: true, createdAt: true });
export const insertAwardPeriodSchema = createInsertSchema(awardPeriods).omit({ id: true, createdAt: true });
export const insertAwardEntrySchema = createInsertSchema(awardEntries).omit({ id: true, createdAt: true });
export const insertAwardVoteSchema = createInsertSchema(awardVotes).omit({ id: true, createdAt: true });
export const insertStaticPageSchema = createInsertSchema(staticPages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true });

// Admin user insert and select schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true, updatedAt: true });
export const selectAdminUserSchema = createSelectSchema(adminUsers);
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Login attempt insert and select schemas
export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).omit({ id: true, attemptedAt: true });
export const selectLoginAttemptSchema = createSelectSchema(loginAttempts);
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttempts.$inferSelect;


// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artists.$inferSelect;

export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releases.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertRadioShow = z.infer<typeof insertRadioShowSchema>;
export type RadioShow = typeof radioShows.$inferSelect;

export type InsertRadioTrack = z.infer<typeof insertRadioTrackSchema>;
export type RadioTrack = typeof radioTracks.$inferSelect;

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertPressAsset = z.infer<typeof insertPressAssetSchema>;
export type PressAsset = typeof pressAssets.$inferSelect;

export type InsertRadioSettings = z.infer<typeof insertRadioSettingsSchema>;
export type RadioSettings = typeof radioSettings.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;

export type InsertPlayCount = z.infer<typeof insertPlayCountSchema>;
export type PlayCount = typeof playCounts.$inferSelect;

export type InsertRadioListener = z.infer<typeof insertRadioListenerSchema>;
export type RadioListener = typeof radioListeners.$inferSelect;

export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof tours.$inferSelect;

export type InsertTourDate = z.infer<typeof insertTourDateSchema>;
export type TourDate = typeof tourDates.$inferSelect;

export type InsertCareer = z.infer<typeof insertCareerSchema>;
export type Career = typeof careers.$inferSelect;

export type InsertCareerApplication = z.infer<typeof insertCareerApplicationSchema>;
export type CareerApplication = typeof careerApplications.$inferSelect;

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export type InsertNewsletterTemplate = z.infer<typeof insertNewsletterTemplateSchema>;
export type NewsletterTemplate = typeof newsletterTemplates.$inferSelect;

export type InsertNewsletterCampaign = z.infer<typeof insertNewsletterCampaignSchema>;
export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;

export type InsertSeoSettings = z.infer<typeof insertSeoSettingsSchema>;
export type SeoSettings = typeof seoSettings.$inferSelect;

export type InsertAwardCategory = z.infer<typeof insertAwardCategorySchema>;
export type AwardCategory = typeof awardCategories.$inferSelect;

export type InsertAwardPeriod = z.infer<typeof insertAwardPeriodSchema>;
export type AwardPeriod = typeof awardPeriods.$inferSelect;

export type InsertAwardEntry = z.infer<typeof insertAwardEntrySchema>;
export type AwardEntry = typeof awardEntries.$inferSelect;

export type InsertAwardVote = z.infer<typeof insertAwardVoteSchema>;
export type AwardVote = typeof awardVotes.$inferSelect;

export type InsertStaticPage = z.infer<typeof insertStaticPageSchema>;
export type StaticPage = typeof staticPages.$inferSelect;

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;