import { supabase } from './supabase';

export interface Artist {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  imageUrl?: string;
  spotifyArtistId?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    spotify?: string;
    soundcloud?: string;
    youtube?: string;
  };
  featured: boolean;
  createdAt: string;
}

export interface Release {
  id: string;
  title: string;
  slug: string;
  artistId?: string;
  artistName: string;
  coverUrl?: string;
  releaseDate?: string;
  genres?: string[];
  spotifyAlbumId?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  soundcloudUrl?: string;
  previewUrl?: string;
  type: string;
  featured: boolean;
  featuredUntil?: string;
  published: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  venue: string;
  address?: string;
  city: string;
  country: string;
  lat?: string;
  lng?: string;
  date: string;
  endDate?: string;
  imageUrl?: string;
  ticketUrl?: string;
  ticketPrice?: string;
  currency?: string;
  capacity?: number;
  rsvpCount: number;
  artistIds?: string[];
  featured: boolean;
  published: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverUrl?: string;
  category: string;
  tags?: string[];
  authorId?: string;
  authorName?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  publishedAt?: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
}

export interface RadioShow {
  id: string;
  title: string;
  slug: string;
  description?: string;
  hostName: string;
  hostBio?: string;
  hostImageUrl?: string;
  coverUrl?: string;
  streamUrl?: string;
  recordedUrl?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  timezone: string;
  repeat24h?: boolean;
  isLive: boolean;
  published: boolean;
  createdAt: string;
}

export interface RadioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  duration?: number;
  playedAt: string;
  showId?: string;
  soundcloudUrl?: string;
  createdAt: string;
}

export interface Playlist {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  spotifyPlaylistId?: string;
  spotifyUrl?: string;
  trackCount: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  youtubeId?: string;
  vimeoId?: string;
  artistId?: string;
  artistName?: string;
  duration?: string;
  category: string;
  featured: boolean;
  published: boolean;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  category: string;
  attachmentUrl?: string;
  status: string;
  createdAt: string;
}

export interface PromoteReleaseSubmission {
  id: string;
  artistName: string;
  instagram?: string;
  trackTitle: string;
  trackLink?: string;
  releaseDate?: string;
  describeTrack?: string;
  monthlyListeners?: number;
  promoContent?: string;
  promotionGoal?: string;
  budget?: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface PromoteEventSubmission {
  id: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  eventType?: string;
  tellUsMore?: string;
  expectedAttendance?: number;
  ticketingLink?: string;
  promoContent?: string;
  instagramOrWebsiteLink?: string;
  whatDoYouNeedFromUs?: string;
  budget?: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface AdminMessage {
  id: string;
  sourceTable: string;
  category: string;
  status: string;
  createdAt: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  payload?: any;
}

export interface RadioSettings {
  id: string;
  stationName: string;
  streamUrl?: string;
  fallbackStreamUrl?: string;
  currentTrack?: string;
  currentArtist?: string;
  currentCoverUrl?: string;
  currentShowName?: string;
  currentHostName?: string;
  isLive: boolean;
  listenerCount: number;
  updatedAt: string;
}

export interface Career {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  salary?: string;
  published: boolean;
  createdAt: string;
}

export interface CareerApplication {
  id: string;
  careerId?: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  status: string;
  createdAt: string;
}

export interface Tour {
  id: string;
  title: string;
  slug: string;
  artistName: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate?: string;
  currency?: string;
  published: boolean;
  createdAt: string;
}

export interface TourDate {
  id: string;
  tourId: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  ticketUrl?: string;
  ticketPrice?: string;
  soldOut: boolean;
  createdAt: string;
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  source?: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  active: boolean;
  stateId?: string;
  optedOut?: boolean;
  optedOutAt?: string;
  updatedAt?: string;
}

export interface NewsletterState {
  id: string;
  key: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  description?: string;
  schemaVersion: number;
  isDefault: boolean;
  globalSettings: Record<string, any>;
  sections: any[];
  assets: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterCampaign {
  id: string;
  templateId?: string;
  senderProfileId?: string;
  subject?: string;
  preheader?: string;
  content: Record<string, any>;
  renderedHtml?: string;
  status: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeoSettings {
  id: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  ogImage?: string;
  twitterImage?: string;
  twitterHandle: string;
  organizationSchema: Record<string, any>;
  websiteSchema: Record<string, any>;
  musicGroupSchema: Record<string, any>;
  headScripts?: string;
  bodyScripts?: string;
  updatedAt: string;
  createdAt: string;
}

export interface AwardCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'artist' | 'track';
  period: 'week' | 'month';
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface AwardPeriod {
  id: string;
  categoryId: string;
  name: string;
  startDate: string;
  endDate: string;
  votingOpen: boolean;
  winnerId?: string;
  announcedAt?: string;
  createdAt: string;
}

export interface AwardEntry {
  id: string;
  periodId: string;
  artistId?: string;
  artistName?: string;
  artistImageUrl?: string;
  artistBio?: string;
  trackTitle?: string;
  trackArtist?: string;
  trackCoverUrl?: string;
  trackAudioUrl?: string;
  trackDuration?: number;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  soundcloudUrl?: string;
  voteCount: number;
  displayOrder: number;
  isWinner: boolean;
  createdAt: string;
}

export interface AwardVote {
  id: string;
  entryId: string;
  periodId: string;
  userId?: string;
  voterIp?: string;
  voterEmail?: string;
  fingerprint?: string;
  createdAt: string;
}

export interface PressAsset {
  id: string;
  title: string;
  description?: string;
  category: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  published: boolean;
  createdAt: string;
}

export interface PageView {
  id: string;
  pagePath: string;
  pageTitle?: string;
  referrer?: string;
  userAgent?: string;
  sessionId?: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  eventCategory?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  createdAt: string;
}

export interface RadioSession {
  id: string;
  showId?: string;
  sessionId?: string;
  durationSeconds: number;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalPageViews: number;
  todayPageViews: number;
  weekPageViews: number;
  monthPageViews: number;
  totalReleaseClicks: number;
  totalRadioListens: number;
  totalRadioDuration: number;
  radioTracksToday: number;
  newsletterSubscribers: number;
  activeSubscribers: number;
  contactSubmissions: number;
  newContactSubmissions: number;
  totalRsvps: number;
  totalEventTicketClicks: number;
  topPages: { path: string; views: number }[];
  topReleases: { id: string; name: string; clicks: number }[];
  topEvents: { id: string; name: string; clicks: number }[];
  topReferrers: { referrer: string; count: number }[];
  pageViewsByDay: { date: string; views: number }[];
  pageViewsTodayByHour: { hour: number; views: number }[];
  pageViewsLast24HoursByHour: { hourStart: string; views: number }[];
  radioShowStats: { showId: string; showName: string; listens: number; avgDuration: number; totalDuration: number }[];
}

export interface MarqueeItem {
  text: string;
  icon: string;
}

export interface PartnerMarqueeItem {
  imageUrl: string;
  alt?: string;
  href?: string;
}

export interface StatItem {
  value: number;
  label: string;
  suffix: string;
  prefix: string;
  icon: string;
}

export interface PageHeroOverride {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
}

export type PageHeroOverrides = Record<string, PageHeroOverride>;

export interface PageSectionConfig {
  id: string;
  enabled: boolean;
  order: number;
  title?: string;
  highlight?: string;
  subtitle?: string;
  description?: string;
  tag?: string;
  actionLabel?: string;
  actionHref?: string;
  carouselEnabled?: boolean;
  carouselIntervalMs?: number;
  featuredReleaseIds?: string[];
}

export interface SiteSettings {
  id?: string;
  emailServiceConfig?: string; // JSON string of email service configuration
  contactEmail?: string;
  contactEmailSubtext?: string;
  contactPhone?: string;
  contactPhoneSubtext?: string;
  contactAddress?: string;
  contactAddressSubtext?: string;
  socialLinks?: {
    spotify?: string;
    instagram?: string;
    x?: string;
    youtube?: string;
    soundcloud?: string;
    tiktok?: string;
  };
  heroTag?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundImage?: string;
  heroBackgroundVideo?: string;
  heroBackgroundType?: 'image' | 'video';
  heroCtaText?: string;
  heroCtaLink?: string;
  showHeroRadio?: boolean;
  marqueeItems?: MarqueeItem[];
  marqueeSpeed?: number;
  partnersMarqueeItems?: PartnerMarqueeItem[];
  partnersMarqueeSpeed?: number;
  partnersMarqueeGap?: number;
  partnersMarqueeLogoHeight?: number;
  partnersMarqueeUseMutedBg?: boolean;
  statsItems?: StatItem[];
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterButtonText?: string;
  newsletterDisclaimer?: string;
  pageHeroOverrides?: PageHeroOverrides;
  homeSections?: PageSectionConfig[];
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatarUrl?: string;
  rating: number;
  displayOrder: number;
  published: boolean;
  createdAt: string;
}

function convertSnakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertSnakeToCamel);

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = convertSnakeToCamel(obj[key]);
    return acc;
  }, {} as any);
}

function convertCamelToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertCamelToSnake);

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = convertCamelToSnake(obj[key]);
    return acc;
  }, {} as any);
}

export const db = {
  artists: {
    async getAll(): Promise<Artist[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('artists').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getFeatured(): Promise<Artist[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('artists').select('*').eq('featured', true);
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Artist | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('artists').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async getBySlug(slug: string): Promise<Artist | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('artists').select('*').eq('slug', slug).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(artist: Partial<Artist>): Promise<Artist> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('artists').insert(convertCamelToSnake(artist)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, artist: Partial<Artist>): Promise<Artist> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('artists').update(convertCamelToSnake(artist)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('artists').delete().eq('id', id);
      if (error) throw error;
    }
  },

  releases: {
    async getAll(): Promise<Release[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('releases').select('*').order('release_date', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublished(): Promise<Release[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('releases').select('*').eq('published', true).order('release_date', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getFeaturedPublishedPage(limit = 24, offset = 0): Promise<Release[]> {
      if (!supabase) return [];
      const from = Math.max(0, offset);
      const to = from + Math.max(1, limit) - 1;
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('published', true)
        .eq('featured', true)
        .order('release_date', { ascending: false, nullsFirst: false })
        .range(from, to);
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublishedPage(limit = 24, offset = 0): Promise<Release[]> {
      if (!supabase) return [];
      const from = Math.max(0, offset);
      const to = from + Math.max(1, limit) - 1;
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('published', true)
        .order('release_date', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async searchPublishedPage(params: {
      limit?: number;
      offset?: number;
      searchQuery?: string;
      type?: string;
      sortBy?: 'newest' | 'oldest' | 'title';
    }): Promise<Release[]> {
      if (!supabase) return [];

      const limit = params.limit ?? 24;
      const offset = params.offset ?? 0;
      const from = Math.max(0, offset);
      const to = from + Math.max(1, limit) - 1;

      const searchQuery = (params.searchQuery ?? '').trim();
      const type = (params.type ?? '').trim();

      let query = supabase
        .from('releases')
        .select('*')
        .eq('published', true);

      if (searchQuery) {
        const safeQuery = searchQuery.replace(/,/g, ' ');
        query = query.or(`title.ilike.%${safeQuery}%,artist_name.ilike.%${safeQuery}%`);
      }

      if (type && type.toLowerCase() !== 'all') {
        query = query.eq('type', type);
      }

      if (params.sortBy === 'oldest') {
        query = query.order('release_date', { ascending: true, nullsFirst: false });
      } else if (params.sortBy === 'title') {
        query = query.order('title', { ascending: true }).order('release_date', { ascending: false, nullsFirst: false });
      } else {
        query = query.order('release_date', { ascending: false, nullsFirst: false });
      }

      const { data, error } = await query.range(from, to);
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Release | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('releases').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async getBySlug(slug: string): Promise<Release | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('releases').select('*').eq('slug', slug).eq('published', true).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(release: Partial<Release>): Promise<Release> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('releases').insert(convertCamelToSnake(release)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, release: Partial<Release>): Promise<Release> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('releases').update(convertCamelToSnake(release)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('releases').delete().eq('id', id);
      if (error) throw error;
    }
  },

  events: {
    async getAll(): Promise<Event[]> {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getUpcoming(): Promise<Event[]> {
      if (!supabase) return [];

      // `events.date` / `events.end_date` are stored as Postgres `timestamp` (no timezone).
      // Passing an ISO string with a timezone (e.g. trailing `Z`) can cause Postgres to
      // timezone-convert during casts, resulting in incorrect filtering.
      const nowStr = new Date().toISOString().replace('Z', '');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('published', true)
        .or(`end_date.gte.${nowStr},and(end_date.is.null,date.gte.${nowStr})`)
        .order('featured', { ascending: false })
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Event | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async getBySlug(slug: string): Promise<Event | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('events').select('*').eq('slug', slug).eq('published', true).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(event: Partial<Event>): Promise<Event> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('events').insert(convertCamelToSnake(event)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, event: Partial<Event>): Promise<Event> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('events').update(convertCamelToSnake(event)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    }
  },

  posts: {
    async getAll(): Promise<Post[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublished(): Promise<Post[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('posts').select('*').eq('published', true).order('published_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublishedPage(limit = 12, offset = 0): Promise<Post[]> {
      if (!supabase) return [];
      const from = Math.max(0, offset);
      const to = from + Math.max(1, limit) - 1;
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Post | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async getBySlug(slug: string): Promise<Post | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).eq('published', true).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(post: Partial<Post>): Promise<Post> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('posts').insert(convertCamelToSnake(post)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, post: Partial<Post>): Promise<Post> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('posts').update(convertCamelToSnake(post)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    }
  },

  radioShows: {
    async getAll(): Promise<RadioShow[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('radio_shows').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<RadioShow | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('radio_shows').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(show: Partial<RadioShow>): Promise<RadioShow> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('radio_shows').insert(convertCamelToSnake(show)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, show: Partial<RadioShow>): Promise<RadioShow> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('radio_shows').update(convertCamelToSnake(show)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('radio_shows').delete().eq('id', id);
      if (error) throw error;
    }
  },

  playlists: {
    async getAll(): Promise<Playlist[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('playlists').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getFeaturedPublishedPage(limit = 24, offset = 0): Promise<Playlist[]> {
      if (!supabase) return [];
      const from = Math.max(0, offset);
      const to = from + Math.max(1, limit) - 1;
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('published', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublishedPage(limit = 24, offset = 0): Promise<Playlist[]> {
      if (!supabase) return [];
      const from = Math.max(0, offset);
      const to = from + Math.max(1, limit) - 1;
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Playlist | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('playlists').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(playlist: Partial<Playlist>): Promise<Playlist> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('playlists').insert(convertCamelToSnake(playlist)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, playlist: Partial<Playlist>): Promise<Playlist> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('playlists').update(convertCamelToSnake(playlist)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) throw error;
    }
  },

  videos: {
    async getAll(): Promise<Video[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublishedPage(limit = 24, offset = 0): Promise<Video[]> {
      if (!supabase) return [];
      const from = Math.max(0, offset);
      const to = from + Math.max(1, limit) - 1;
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Video | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('videos').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(video: Partial<Video>): Promise<Video> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('videos').insert(convertCamelToSnake(video)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, video: Partial<Video>): Promise<Video> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('videos').update(convertCamelToSnake(video)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
    }
  },

  contacts: {
    async getAll(): Promise<Contact[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Contact | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(contact: Partial<Contact>): Promise<Contact> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('contacts').insert(convertCamelToSnake(contact)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, contact: Partial<Contact>): Promise<Contact> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('contacts').update(convertCamelToSnake(contact)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    }
  },

  promoteReleaseSubmissions: {
    async getAll(): Promise<PromoteReleaseSubmission[]> {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('promote_release_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<PromoteReleaseSubmission | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('promote_release_submissions').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(submission: Partial<PromoteReleaseSubmission>): Promise<PromoteReleaseSubmission> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('promote_release_submissions')
        .insert(convertCamelToSnake(submission))
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, submission: Partial<PromoteReleaseSubmission>): Promise<PromoteReleaseSubmission> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('promote_release_submissions')
        .update(convertCamelToSnake(submission))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('promote_release_submissions').delete().eq('id', id);
      if (error) throw error;
    }
  },

  promoteEventSubmissions: {
    async getAll(): Promise<PromoteEventSubmission[]> {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('promote_event_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<PromoteEventSubmission | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('promote_event_submissions').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(submission: Partial<PromoteEventSubmission>): Promise<PromoteEventSubmission> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('promote_event_submissions')
        .insert(convertCamelToSnake(submission))
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, submission: Partial<PromoteEventSubmission>): Promise<PromoteEventSubmission> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('promote_event_submissions')
        .update(convertCamelToSnake(submission))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('promote_event_submissions').delete().eq('id', id);
      if (error) throw error;
    }
  },

  adminMessages: {
    async getAll(): Promise<AdminMessage[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('admin_messages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async updateStatus(args: { sourceTable: string; id: string; status: string }): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { sourceTable, id, status } = args;
      if (sourceTable === 'contacts') {
        await db.contacts.update(id, { status });
        return;
      }
      if (sourceTable === 'promote_release_submissions') {
        await db.promoteReleaseSubmissions.update(id, { status });
        return;
      }
      if (sourceTable === 'promote_event_submissions') {
        await db.promoteEventSubmissions.update(id, { status });
        return;
      }
      throw new Error(`Unknown message source: ${sourceTable}`);
    },
    async delete(args: { sourceTable: string; id: string }): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { sourceTable, id } = args;
      if (sourceTable === 'contacts') {
        await db.contacts.delete(id);
        return;
      }
      if (sourceTable === 'promote_release_submissions') {
        await db.promoteReleaseSubmissions.delete(id);
        return;
      }
      if (sourceTable === 'promote_event_submissions') {
        await db.promoteEventSubmissions.delete(id);
        return;
      }
      throw new Error(`Unknown message source: ${sourceTable}`);
    }
  },

  radioSettings: {
    async get(): Promise<RadioSettings | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('radio_settings').select('*').limit(1).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async update(settings: Partial<RadioSettings>): Promise<RadioSettings> {
      if (!supabase) throw new Error('Database not configured');
      const { data: existing } = await supabase.from('radio_settings').select('id').limit(1).single();
      if (existing) {
        const { data, error } = await supabase.from('radio_settings').update(convertCamelToSnake(settings)).eq('id', existing.id).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      } else {
        const { data, error } = await supabase.from('radio_settings').insert(convertCamelToSnake(settings)).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      }
    }
  },

  careers: {
    async getAll(): Promise<Career[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('careers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublished(): Promise<Career[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('careers').select('*').eq('published', true).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Career | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('careers').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async getBySlug(slug: string): Promise<Career | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('careers').select('*').eq('slug', slug).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(career: Partial<Career>): Promise<Career> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('careers').insert(convertCamelToSnake(career)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, career: Partial<Career>): Promise<Career> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('careers').update(convertCamelToSnake(career)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('careers').delete().eq('id', id);
      if (error) throw error;
    }
  },

  careerApplications: {
    async getAll(): Promise<CareerApplication[]> {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('career_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getByCareerId(careerId: string): Promise<CareerApplication[]> {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('career_applications')
        .select('*')
        .eq('career_id', careerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<CareerApplication | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('career_applications').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(application: Partial<CareerApplication>): Promise<CareerApplication> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('career_applications')
        .insert(convertCamelToSnake(application))
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, application: Partial<CareerApplication>): Promise<CareerApplication> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('career_applications')
        .update(convertCamelToSnake(application))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('career_applications').delete().eq('id', id);
      if (error) throw error;
    }
  },

  tours: {
    async getAll(): Promise<Tour[]> {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('start_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublished(): Promise<Tour[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('tours').select('*').eq('published', true).order('start_date', { ascending: true });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Tour | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('tours').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async getBySlug(slug: string): Promise<Tour | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('tours').select('*').eq('slug', slug).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(tour: Partial<Tour>): Promise<Tour> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('tours').insert(convertCamelToSnake(tour)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, tour: Partial<Tour>): Promise<Tour> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('tours').update(convertCamelToSnake(tour)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('tours').delete().eq('id', id);
      if (error) throw error;
    }
  },

  tourDates: {
    async getByTourId(tourId: string): Promise<TourDate[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('tour_dates').select('*').eq('tour_id', tourId).order('date', { ascending: true });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async create(tourDate: Partial<TourDate>): Promise<TourDate> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('tour_dates').insert(convertCamelToSnake(tourDate)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, tourDate: Partial<TourDate>): Promise<TourDate> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('tour_dates').update(convertCamelToSnake(tourDate)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('tour_dates').delete().eq('id', id);
      if (error) throw error;
    }
  },

  staticPages: {
    async getAll(): Promise<StaticPage[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('static_pages').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getBySlug(slug: string): Promise<StaticPage | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('static_pages').select('*').eq('slug', slug).eq('published', true).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async getById(id: string): Promise<StaticPage | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('static_pages').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async update(id: string, page: Partial<StaticPage>): Promise<StaticPage> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('static_pages').update({ ...convertCamelToSnake(page), updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async create(page: Partial<StaticPage>): Promise<StaticPage> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('static_pages').insert(convertCamelToSnake(page)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    }
  },

  newsletterSubscribers: {
    async subscribe(email: string, name?: string, source: string = 'website'): Promise<NewsletterSubscriber> {
      if (!supabase) throw new Error('Database not configured');
      const existingResult = await supabase.from('newsletter_subscribers').select('*').eq('email', email.toLowerCase()).single();
      if (existingResult.data) {
        if (!existingResult.data.active || !!(existingResult.data as any).opted_out) {
          const { data, error } = await supabase
            .from('newsletter_subscribers')
            .update({
              active: true,
              unsubscribed_at: null,
              opted_out: false,
              opted_out_at: null,
              source,
              ...(name ? { name } : {}),
            })
            .eq('email', email.toLowerCase())
            .select()
            .single();
          if (error) throw error;
          return convertSnakeToCamel(data);
        }
        throw new Error('Email already subscribed');
      }
      const { data, error } = await supabase.from('newsletter_subscribers').insert({ email: email.toLowerCase(), name, source, active: true }).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async upsert(args: {
      email: string;
      name?: string;
      source?: string;
      stateId?: string;
      active?: boolean;
      optedOut?: boolean;
    }): Promise<NewsletterSubscriber> {
      if (!supabase) throw new Error('Database not configured');

      const email = String(args.email || '').toLowerCase().trim();
      if (!email || !email.includes('@')) throw new Error('Invalid email');

      const payload: any = {
        email,
        source: args.source || 'manual',
        active: args.active ?? true,
        opted_out: args.optedOut ?? false,
      };

      if (args.name) payload.name = args.name;
      if (args.stateId) payload.state_id = args.stateId;

      if (payload.active) payload.unsubscribed_at = null;
      if (!payload.opted_out) payload.opted_out_at = null;

      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .upsert(payload, { onConflict: 'email' })
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async getAll(): Promise<NewsletterSubscriber[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async update(id: string, subscriber: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .update(convertCamelToSnake(subscriber))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async unsubscribe(email: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('newsletter_subscribers').update({ active: false, unsubscribed_at: new Date().toISOString() }).eq('email', email.toLowerCase());
      if (error) throw error;
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
      if (error) throw error;
    }
  },

  newsletterStates: {
    async getAll(): Promise<NewsletterState[]> {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('newsletter_states')
        .select('*')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async create(state: { name: string; key?: string; color?: string }): Promise<NewsletterState> {
      if (!supabase) throw new Error('Database not configured');
      const payload: any = { name: String(state.name || '').trim() };
      if (state.key && String(state.key).trim()) payload.key = String(state.key).trim();
      if (state.color && String(state.color).trim()) payload.color = String(state.color).trim();
      const { data, error } = await supabase.from('newsletter_states').insert(payload).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, state: Partial<NewsletterState>): Promise<NewsletterState> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('newsletter_states')
        .update(convertCamelToSnake(state))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('newsletter_states').delete().eq('id', id);
      if (error) throw error;
    },
  },

  newsletterTemplates: {
    async getAll(): Promise<NewsletterTemplate[]> {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('newsletter_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<NewsletterTemplate | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('newsletter_templates').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return convertSnakeToCamel(data);
    },
    async create(template: Partial<NewsletterTemplate>): Promise<NewsletterTemplate> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('newsletter_templates')
        .insert(convertCamelToSnake(template))
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, template: Partial<NewsletterTemplate>): Promise<NewsletterTemplate> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('newsletter_templates')
        .update(convertCamelToSnake(template))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('newsletter_templates').delete().eq('id', id);
      if (error) throw error;
    },
    async setDefault(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');

      const { error: clearErr } = await supabase
        .from('newsletter_templates')
        .update({ is_default: false })
        .neq('id', id);
      if (clearErr) throw clearErr;

      const { error: setErr } = await supabase
        .from('newsletter_templates')
        .update({ is_default: true })
        .eq('id', id);
      if (setErr) throw setErr;
    },
  },

  newsletterCampaigns: {
    async getAll(): Promise<NewsletterCampaign[]> {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<NewsletterCampaign | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('newsletter_campaigns').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return convertSnakeToCamel(data);
    },
    async create(campaign: Partial<NewsletterCampaign>): Promise<NewsletterCampaign> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .insert(convertCamelToSnake(campaign))
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, campaign: Partial<NewsletterCampaign>): Promise<NewsletterCampaign> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .update(convertCamelToSnake(campaign))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('newsletter_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
  },

  seoSettings: {
    async get(): Promise<SeoSettings | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      return convertSnakeToCamel(data);
    },
    async update(settings: Partial<SeoSettings>): Promise<SeoSettings> {
      if (!supabase) throw new Error('Database not configured');
      const { data: existing } = await supabase
        .from('seo_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const {
        organizationSchema,
        websiteSchema,
        musicGroupSchema,
        ...rest
      } = settings;

      const payload: any = {
        ...convertCamelToSnake(rest),
        updated_at: new Date().toISOString(),
      };

      if (organizationSchema !== undefined) payload.organization_schema = organizationSchema;
      if (websiteSchema !== undefined) payload.website_schema = websiteSchema;
      if (musicGroupSchema !== undefined) payload.music_group_schema = musicGroupSchema;

      if (existing) {
        const { data, error } = await supabase.from('seo_settings').update(payload).eq('id', existing.id).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      } else {
        const { data, error } = await supabase.from('seo_settings').insert(payload).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      }
    }
  },

  awards: {
    categories: {
      async getAll(): Promise<AwardCategory[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.from('award_categories').select('*').order('display_order', { ascending: true });
        if (error) throw error;
        return (data || []).map(convertSnakeToCamel);
      },
      async getActive(): Promise<AwardCategory[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.from('award_categories').select('*').eq('is_active', true).order('display_order', { ascending: true });
        if (error) throw error;
        return (data || []).map(convertSnakeToCamel);
      },
      async getById(id: string): Promise<AwardCategory | null> {
        if (!supabase) return null;
        const { data, error } = await supabase.from('award_categories').select('*').eq('id', id).single();
        if (error) return null;
        return convertSnakeToCamel(data);
      },
      async create(category: Partial<AwardCategory>): Promise<AwardCategory> {
        if (!supabase) throw new Error('Database not configured');
        const { data, error } = await supabase.from('award_categories').insert(convertCamelToSnake(category)).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      },
      async update(id: string, category: Partial<AwardCategory>): Promise<AwardCategory> {
        if (!supabase) throw new Error('Database not configured');
        const { data, error } = await supabase.from('award_categories').update(convertCamelToSnake(category)).eq('id', id).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      },
      async delete(id: string): Promise<void> {
        if (!supabase) throw new Error('Database not configured');
        const { error } = await supabase.from('award_categories').delete().eq('id', id);
        if (error) throw error;
      }
    },
    periods: {
      async getAll(): Promise<AwardPeriod[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.from('award_periods').select('*').order('start_date', { ascending: false });
        if (error) throw error;
        return (data || []).map(convertSnakeToCamel);
      },
      async getByCategoryId(categoryId: string): Promise<AwardPeriod[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.from('award_periods').select('*').eq('category_id', categoryId).order('start_date', { ascending: false });
        if (error) throw error;
        return (data || []).map(convertSnakeToCamel);
      },
      async getActiveVoting(): Promise<AwardPeriod[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.from('award_periods').select('*').eq('voting_open', true).order('start_date', { ascending: false });
        if (error) throw error;
        return (data || []).map(convertSnakeToCamel);
      },
      async getById(id: string): Promise<AwardPeriod | null> {
        if (!supabase) return null;
        const { data, error } = await supabase.from('award_periods').select('*').eq('id', id).single();
        if (error) return null;
        return convertSnakeToCamel(data);
      },
      async create(period: Partial<AwardPeriod>): Promise<AwardPeriod> {
        if (!supabase) throw new Error('Database not configured');
        const { data, error } = await supabase.from('award_periods').insert(convertCamelToSnake(period)).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      },
      async update(id: string, period: Partial<AwardPeriod>): Promise<AwardPeriod> {
        if (!supabase) throw new Error('Database not configured');
        const { data, error } = await supabase.from('award_periods').update(convertCamelToSnake(period)).eq('id', id).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      },
      async delete(id: string): Promise<void> {
        if (!supabase) throw new Error('Database not configured');
        const { error } = await supabase.from('award_periods').delete().eq('id', id);
        if (error) throw error;
      }
    },
    entries: {
      async getByPeriodId(periodId: string): Promise<AwardEntry[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('award_entries')
          .select('*, artists ( name, bio, image_url )')
          .eq('period_id', periodId)
          .order('display_order', { ascending: true })
          .order('vote_count', { ascending: false });
        if (error) throw error;
        return (data || []).map((row: any) => {
          const converted: any = convertSnakeToCamel(row);
          const artist: any = converted.artists;

          const entry: any = { ...converted };
          if (!entry.artistName && artist?.name) entry.artistName = artist.name;
          if (!entry.artistBio && artist?.bio) entry.artistBio = artist.bio;
          if (!entry.artistImageUrl && artist?.imageUrl) entry.artistImageUrl = artist.imageUrl;
          delete entry.artists;
          return entry as AwardEntry;
        });
      },
      async getById(id: string): Promise<AwardEntry | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('award_entries')
          .select('*, artists ( name, bio, image_url )')
          .eq('id', id)
          .single();
        if (error) return null;
        const converted: any = convertSnakeToCamel(data);
        const artist: any = converted.artists;

        const entry: any = { ...converted };
        if (!entry.artistName && artist?.name) entry.artistName = artist.name;
        if (!entry.artistBio && artist?.bio) entry.artistBio = artist.bio;
        if (!entry.artistImageUrl && artist?.imageUrl) entry.artistImageUrl = artist.imageUrl;
        delete entry.artists;
        return entry as AwardEntry;
      },
      async create(entry: Partial<AwardEntry>): Promise<AwardEntry> {
        if (!supabase) throw new Error('Database not configured');
        const { data, error } = await supabase.from('award_entries').insert(convertCamelToSnake(entry)).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      },
      async update(id: string, entry: Partial<AwardEntry>): Promise<AwardEntry> {
        if (!supabase) throw new Error('Database not configured');
        const { data, error } = await supabase.from('award_entries').update(convertCamelToSnake(entry)).eq('id', id).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      },
      async delete(id: string): Promise<void> {
        if (!supabase) throw new Error('Database not configured');
        const { error } = await supabase.from('award_entries').delete().eq('id', id);
        if (error) throw error;
      }
    },
    votes: {
      async submit(entryId: string, periodId: string, voterIp?: string, fingerprint?: string): Promise<AwardVote> {
        if (!supabase) throw new Error('Database not configured');
        const { data, error } = await supabase.from('award_votes').insert({
          entry_id: entryId,
          period_id: periodId,
          voter_ip: voterIp,
          fingerprint: fingerprint
        }).select().single();
        if (error) {
          if (error.code === '23505') {
            throw new Error('You have already voted in this period');
          }
          throw error;
        }
        return convertSnakeToCamel(data);
      },
      async getByPeriodId(periodId: string): Promise<AwardVote[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.from('award_votes').select('*').eq('period_id', periodId);
        if (error) throw error;
        return (data || []).map(convertSnakeToCamel);
      },
      async hasVoted(periodId: string, voterIp: string): Promise<boolean> {
        if (!supabase) return false;
        const { data } = await supabase.from('award_votes').select('id').eq('period_id', periodId).eq('voter_ip', voterIp).limit(1);
        return (data?.length || 0) > 0;
      }
    }
  },

  pressAssets: {
    async getAll(): Promise<PressAsset[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('press_assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublished(): Promise<PressAsset[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('press_assets').select('*').eq('published', true).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<PressAsset | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('press_assets').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(asset: Partial<PressAsset>): Promise<PressAsset> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('press_assets').insert(convertCamelToSnake(asset)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, asset: Partial<PressAsset>): Promise<PressAsset> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('press_assets').update(convertCamelToSnake(asset)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('press_assets').delete().eq('id', id);
      if (error) throw error;
    }
  },

  testimonials: {
    async getAll(): Promise<Testimonial[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('testimonials').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getPublished(): Promise<Testimonial[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('testimonials').select('*').eq('published', true).order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getById(id: string): Promise<Testimonial | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('testimonials').select('*').eq('id', id).single();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async create(testimonial: Partial<Testimonial>): Promise<Testimonial> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('testimonials').insert(convertCamelToSnake(testimonial)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async update(id: string, testimonial: Partial<Testimonial>): Promise<Testimonial> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('testimonials').update(convertCamelToSnake(testimonial)).eq('id', id).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
    }
  },

  radioTracks: {
    async getRecent(limit: number = 10): Promise<RadioTrack[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('radio_tracks').select('*').order('played_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async getByShowId(showId: string): Promise<RadioTrack[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('radio_tracks').select('*').eq('show_id', showId).order('played_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(convertSnakeToCamel);
    },
    async create(track: Partial<RadioTrack>): Promise<RadioTrack> {
      if (!supabase) throw new Error('Database not configured');
      const { data, error } = await supabase.from('radio_tracks').insert(convertCamelToSnake(track)).select().single();
      if (error) throw error;
      return convertSnakeToCamel(data);
    },
    async delete(id: string): Promise<void> {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('radio_tracks').delete().eq('id', id);
      if (error) throw error;
    }
  },

  siteSettings: {
    async get(): Promise<SiteSettings | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return convertSnakeToCamel(data);
    },
    async update(settings: Partial<SiteSettings>): Promise<SiteSettings> {
      if (!supabase) throw new Error('Database not configured');
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from('site_settings').update(convertCamelToSnake(settings)).eq('id', existing.id).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      } else {
        const { data, error } = await supabase.from('site_settings').insert(convertCamelToSnake(settings)).select().single();
        if (error) throw error;
        return convertSnakeToCamel(data);
      }
    }
  },

  analytics: {
    async trackPageView(pagePath: string, pageTitle?: string): Promise<void> {
      if (!supabase) return;
      try {
        const sessionId = getOrCreateSessionId();
        await supabase.from('page_views').insert({
          page_path: pagePath,
          page_title: pageTitle,
          referrer: typeof document !== 'undefined' ? document.referrer : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          session_id: sessionId
        });
      } catch (e) {
        console.error('Failed to track page view:', e);
      }
    },

    async trackEvent(eventType: string, options?: {
      category?: string;
      entityType?: string;
      entityId?: string;
      entityName?: string;
      metadata?: Record<string, any>;
    }): Promise<void> {
      if (!supabase) return;
      try {
        const sessionId = getOrCreateSessionId();
        await supabase.from('analytics_events').insert({
          event_type: eventType,
          event_category: options?.category,
          entity_type: options?.entityType,
          entity_id: options?.entityId,
          entity_name: options?.entityName,
          metadata: options?.metadata,
          session_id: sessionId
        });
      } catch (e) {
        console.error('Failed to track event:', e);
      }
    },

    async startRadioSession(showId?: string): Promise<string | null> {
      if (!supabase) return null;
      try {
        const sessionId = getOrCreateSessionId();
        const { data, error } = await supabase.from('radio_sessions').insert({
          show_id: showId,
          session_id: sessionId,
          started_at: new Date().toISOString()
        }).select('id').single();
        if (error) throw error;
        return data.id;
      } catch (e) {
        console.error('Failed to start radio session:', e);
        return null;
      }
    },

    async endRadioSession(radioSessionId: string, durationSeconds: number): Promise<void> {
      if (!supabase) return;
      try {
        await supabase.from('radio_sessions').update({
          duration_seconds: durationSeconds,
          ended_at: new Date().toISOString()
        }).eq('id', radioSessionId);
      } catch (e) {
        console.error('Failed to end radio session:', e);
      }
    },

    async getSummary(): Promise<AnalyticsSummary> {
      if (!supabase) {
        return {
          totalPageViews: 0,
          todayPageViews: 0,
          weekPageViews: 0,
          monthPageViews: 0,
          totalReleaseClicks: 0,
          totalRadioListens: 0,
          totalRadioDuration: 0,
          radioTracksToday: 0,
          newsletterSubscribers: 0,
          activeSubscribers: 0,
          contactSubmissions: 0,
          newContactSubmissions: 0,
          totalRsvps: 0,
          totalEventTicketClicks: 0,
          topPages: [],
          topReleases: [],
          topEvents: [],
          topReferrers: [],
          pageViewsByDay: [],
          pageViewsTodayByHour: [],
          pageViewsLast24HoursByHour: [],
          radioShowStats: []
        };
      }

      const sb = supabase;

      const PAGE_SIZE = 1000;
      const fetchAll = async <T,>(
        buildQuery: (from: number, to: number) => any
      ): Promise<T[]> => {
        const out: T[] = [];
        let from = 0;
        while (true) {
          const to = from + PAGE_SIZE - 1;
          const { data, error } = await buildQuery(from, to);
          if (error) throw error;
          const rows: T[] = (data || []) as T[];
          out.push(...rows);
          if (rows.length < PAGE_SIZE) break;
          from += PAGE_SIZE;
        }
        return out;
      };

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);

      const monthStart = new Date(todayStart);
      monthStart.setDate(monthStart.getDate() - 29);

      const trendStart = new Date(todayStart);
      trendStart.setDate(trendStart.getDate() - 89);

      const todayStartIso = todayStart.toISOString();
      const tomorrowStartIso = tomorrowStart.toISOString();
      const weekStartIso = weekStart.toISOString();
      const monthStartIso = monthStart.toISOString();
      const trendStartIso = trendStart.toISOString();

      const [
        pageViewsResult,
        todayViewsResult,
        weekViewsResult,
        monthViewsResult,
        releaseClicksResult,
        eventTicketClicksResult,
        radioSessionsResult,
        radioTracksTodayResult,
        subscribersResult,
        activeSubscribersResult,
        contactsResult,
        newContactsResult,
        eventsResult,
        releaseEventsResult,
        eventTicketEventsResult,
        radioShowsResult
      ] = await Promise.all([
        sb.from('page_views').select('id', { count: 'exact', head: true }),
        sb.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', todayStartIso).lt('created_at', tomorrowStartIso),
        sb.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', weekStartIso).lt('created_at', tomorrowStartIso),
        sb.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', monthStartIso).lt('created_at', tomorrowStartIso),
        sb.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'release_click'),
        sb.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'event_ticket_click'),
        sb.from('radio_sessions').select('duration_seconds'),
        sb
          .from('radio_tracks')
          .select('played_at, created_at')
          .or(`played_at.gte.${todayStartIso},created_at.gte.${todayStartIso}`),
        sb.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
        sb.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('active', true),
        sb.from('contacts').select('id', { count: 'exact', head: true }),
        sb.from('contacts').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        sb.from('events').select('rsvp_count'),
        sb.from('analytics_events').select('entity_id, entity_name').eq('event_type', 'release_click').gte('created_at', monthStartIso).lt('created_at', tomorrowStartIso),
        sb.from('analytics_events').select('entity_id, entity_name, metadata').eq('event_type', 'event_ticket_click').gte('created_at', monthStartIso).lt('created_at', tomorrowStartIso),
        sb.from('radio_sessions').select('show_id, duration_seconds')
      ]);

      const radioShows = await sb.from('radio_shows').select('id, title');

      const totalRadioDuration = (radioSessionsResult.data || []).reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
      const totalRsvps = (eventsResult.data || []).reduce((acc, e) => acc + (e.rsvp_count || 0), 0);

      const todayStartForRadio = new Date(todayStartIso);
      const radioTracksToday = (radioTracksTodayResult.data || []).filter((t: any) => {
        const dtRaw = t.played_at || t.created_at;
        if (!dtRaw) return false;
        const dt = new Date(dtRaw);
        return dt >= todayStartForRadio;
      }).length;

      const pagePathCounts: Record<string, number> = {};
      const topPagesRows = await fetchAll<{ page_path: string }>((from, to) =>
        sb
          .from('page_views')
          .select('page_path')
          .gte('created_at', monthStartIso)
          .lt('created_at', tomorrowStartIso)
          .order('created_at', { ascending: true })
          .range(from, to)
      );
      (topPagesRows || []).forEach(pv => {
        pagePathCounts[pv.page_path] = (pagePathCounts[pv.page_path] || 0) + 1;
      });
      const topPages = Object.entries(pagePathCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, views]) => ({ path, views }));

      const releaseClickCounts: Record<string, { name: string; clicks: number }> = {};
      (releaseEventsResult.data || []).forEach(ev => {
        if (ev.entity_id) {
          const entityId = ev.entity_id;
          if (!releaseClickCounts[entityId]) {
            releaseClickCounts[entityId] = { name: ev.entity_name || 'Unknown', clicks: 0 };
          }
          releaseClickCounts[entityId].clicks++;
        }
      });
      const topReleases = Object.entries(releaseClickCounts)
        .sort((a, b) => b[1].clicks - a[1].clicks)
        .slice(0, 10)
        .map(([id, data]) => ({ id, name: data.name, clicks: data.clicks }));

      const eventClickCounts: Record<string, { name: string; clicks: number }> = {};
      (eventTicketEventsResult.data || []).forEach((ev: any) => {
        if (ev.entity_id) {
          const entityId = ev.entity_id;
          if (!eventClickCounts[entityId]) {
            eventClickCounts[entityId] = { name: ev.entity_name || 'Unknown', clicks: 0 };
          }
          eventClickCounts[entityId].clicks++;
        }
      });
      const topEvents = Object.entries(eventClickCounts)
        .sort((a, b) => b[1].clicks - a[1].clicks)
        .slice(0, 10)
        .map(([id, data]) => ({ id, name: data.name, clicks: data.clicks }));

      const referrerCounts: Record<string, number> = {};
      const referrerRows = await fetchAll<{ referrer: string }>((from, to) =>
        sb
          .from('page_views')
          .select('referrer')
          .gte('created_at', monthStartIso)
          .lt('created_at', tomorrowStartIso)
          .not('referrer', 'is', null)
          .order('created_at', { ascending: true })
          .range(from, to)
      );
      (referrerRows || []).forEach(pv => {
        if (pv.referrer) {
          try {
            const url = new URL(pv.referrer);
            const host = url.hostname;
            referrerCounts[host] = (referrerCounts[host] || 0) + 1;
          } catch {
            referrerCounts[pv.referrer] = (referrerCounts[pv.referrer] || 0) + 1;
          }
        }
      });
      const topReferrers = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([referrer, count]) => ({ referrer, count }));

      const showsMap = new Map((radioShows.data || []).map(s => [s.id, s.title]));
      const radioShowStats: Record<string, { listens: number; totalDuration: number }> = {};
      (radioShowsResult.data || []).forEach(session => {
        const showId = session.show_id || 'unknown';
        if (!radioShowStats[showId]) {
          radioShowStats[showId] = { listens: 0, totalDuration: 0 };
        }
        radioShowStats[showId].listens++;
        radioShowStats[showId].totalDuration += session.duration_seconds || 0;
      });
      const radioShowStatsArray = Object.entries(radioShowStats)
        .map(([showId, data]) => ({
          showId,
          showName: showsMap.get(showId) || 'Unknown Show',
          listens: data.listens,
          avgDuration: data.listens > 0 ? Math.round(data.totalDuration / data.listens) : 0,
          totalDuration: data.totalDuration
        }))
        .sort((a, b) => b.listens - a.listens);

      const pageViewsByDayRows = await fetchAll<{ created_at: string }>((from, to) =>
        sb
          .from('page_views')
          .select('created_at')
          .gte('created_at', trendStartIso)
          .lt('created_at', tomorrowStartIso)
          .order('created_at', { ascending: true })
          .range(from, to)
      );

      const dailyCounts: Record<string, number> = {};
      (pageViewsByDayRows || []).forEach(pv => {
        if (!pv.created_at) return;
        const dt = new Date(pv.created_at);
        if (Number.isNaN(dt.getTime())) return;
        const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });
      const pageViewsByDay = Object.entries(dailyCounts)
        .map(([date, views]) => ({ date, views }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const pageViewsTodayRows = await fetchAll<{ created_at: string }>((from, to) =>
        sb
          .from('page_views')
          .select('created_at')
          .gte('created_at', todayStartIso)
          .lt('created_at', tomorrowStartIso)
          .order('created_at', { ascending: true })
          .range(from, to)
      );

      const todayStartForViews = new Date(todayStartIso);
      const hourlyCounts: Record<number, number> = {};
      for (let hour = 0; hour < 24; hour++) {
        hourlyCounts[hour] = 0;
      }
      (pageViewsTodayRows || []).forEach((pv) => {
        if (!pv.created_at) return;
        const dt = new Date(pv.created_at);
        if (Number.isNaN(dt.getTime())) return;
        if (dt < todayStartForViews) return;
        const hour = dt.getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      });
      const pageViewsTodayByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        views: hourlyCounts[hour] || 0,
      }));

      const nowHourStart = new Date(now);
      nowHourStart.setMinutes(0, 0, 0);
      const last24Start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const nowIso = now.toISOString();

      const pageViewsLast24Rows = await fetchAll<{ created_at: string }>((from, to) =>
        sb
          .from('page_views')
          .select('created_at')
          .gte('created_at', last24Start.toISOString())
          .lt('created_at', nowIso)
          .order('created_at', { ascending: true })
          .range(from, to)
      );

      const last24HourStarts = Array.from({ length: 24 }, (_, idx) =>
        new Date(nowHourStart.getTime() - (23 - idx) * 60 * 60 * 1000)
      );
      const last24Counts: Record<string, number> = {};
      last24HourStarts.forEach((dt) => {
        last24Counts[dt.toISOString()] = 0;
      });

      (pageViewsLast24Rows || []).forEach((pv) => {
        if (!pv.created_at) return;
        const dt = new Date(pv.created_at);
        if (Number.isNaN(dt.getTime())) return;
        if (dt < last24Start) return;
        const bucket = new Date(dt);
        bucket.setMinutes(0, 0, 0);
        const key = bucket.toISOString();
        if (key in last24Counts) {
          last24Counts[key] = (last24Counts[key] || 0) + 1;
        }
      });

      const pageViewsLast24HoursByHour = last24HourStarts.map((dt) => ({
        hourStart: dt.toISOString(),
        views: last24Counts[dt.toISOString()] || 0,
      }));

      return {
        totalPageViews: pageViewsResult.count || 0,
        todayPageViews: todayViewsResult.count || 0,
        weekPageViews: weekViewsResult.count || 0,
        monthPageViews: monthViewsResult.count || 0,
        totalReleaseClicks: releaseClicksResult.count || 0,
        totalRadioListens: radioSessionsResult.data?.length || 0,
        totalRadioDuration,
        radioTracksToday,
        newsletterSubscribers: subscribersResult.count || 0,
        activeSubscribers: activeSubscribersResult.count || 0,
        contactSubmissions: contactsResult.count || 0,
        newContactSubmissions: newContactsResult.count || 0,
        totalRsvps,
        totalEventTicketClicks: eventTicketClicksResult.count || 0,
        topPages,
        topReleases,
        topEvents,
        topReferrers,
        pageViewsByDay,
        pageViewsTodayByHour,
        pageViewsLast24HoursByHour,
        radioShowStats: radioShowStatsArray
      };
    }
  }
};

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server-' + Date.now();

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}