import { QueryClient } from "@tanstack/react-query";
import { db } from "./database";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryFunctions = {
  releases: () => db.releases.getAll(),
  releasesPublished: () => db.releases.getPublished(),
  artists: () => db.artists.getAll(),
  artistsFeatured: () => db.artists.getFeatured(),
  events: () => db.events.getAll(),
  eventsUpcoming: () => db.events.getUpcoming(),
  posts: () => db.posts.getAll(),
  postsPublished: () => db.posts.getPublished(),
  radioShows: () => db.radioShows.getAll(),
  playlists: () => db.playlists.getAll(),
  videos: () => db.videos.getAll(),
  contacts: () => db.contacts.getAll(),
  adminMessages: () => db.adminMessages.getAll(),
  radioSettings: () => db.radioSettings.get(),
  careers: () => db.careers.getAll(),
  careersPublished: () => db.careers.getPublished(),
  careerApplications: () => db.careerApplications.getAll(),
  tours: () => db.tours.getAll(),
  toursPublished: () => db.tours.getPublished(),
  staticPages: () => db.staticPages.getAll(),
  pressAssets: () => db.pressAssets.getAll(),
  pressAssetsPublished: () => db.pressAssets.getPublished(),
  newsletterSubscribers: () => db.newsletterSubscribers.getAll(),
  newsletterStates: () => db.newsletterStates.getAll(),
  newsletterTemplates: () => db.newsletterTemplates.getAll(),
  newsletterCampaigns: () => db.newsletterCampaigns.getAll(),
  analyticsSummary: () => db.analytics.getSummary(),
  siteSettings: () => db.siteSettings.get(),
  testimonials: () => db.testimonials.getAll(),
  testimonialsPublished: () => db.testimonials.getPublished(),
  recentStreams: () => db.radioTracks.getRecent(20),
};
