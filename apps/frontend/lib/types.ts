export type Plan = {
  id: string;
  name: string;
  priceInr: number;
  videoQuality: string;
  maxScreens: number;
};

export type Profile = {
  id: string;
  name: string;
  isKids: boolean;
};

export type UserSession = {
  userId: string;
  email: string;
  fullName: string;
  referralCode?: string;
  profiles: Profile[];
  activityVisibility?: "public" | "private";
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  subscription?: {
    status: string;
    planId: string;
  };
};

export type CatalogItem = {
  id: string;
  title: string;
  slug: string;
  posterImageUrl?: string;
  kind: string;
  genres: string[];
  isPremium: boolean;
  isLive?: boolean;
  liveStartTime?: string;
  livePlaybackId?: string;
};

export type ContentDetail = {
  id: string;
  title: string;
  description: string;
  slug: string;
  kind: string;
  releaseYear?: number;
  durationMinutes?: number;
  languages: string[];
  genres: string[];
  ageRating?: string;
  cast: string[];
  crew: string[];
  posterImageUrl?: string;
  bannerImageUrl?: string;
  muxPlaybackId?: string;
  liveStreamId?: string;
  livePlaybackId?: string;
  liveBackupPlaybackId?: string;
  isPremium: boolean;
  isKids: boolean;
  isLive: boolean;
  liveStartTime?: string;
};

export type Rating = {
  id: string;
  userId: string;
  rating: number;
  review?: string;
  createdAt: string;
};

export type Channel = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  timezone: string;
  logoUrl?: string;
  isSports: boolean;
};

export type ScheduleItem = {
  id: string;
  channelId: string;
  contentId?: string;
  title: string;
  startTime: string;
  endTime: string;
  timezone: string;
  status: "upcoming" | "live" | "ended";
};

export type LiveEvent = {
  id: string;
  contentId: string;
  channelId?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: string;
  clock: string;
  status: "upcoming" | "live" | "final";
};

export type ActivityEvent = {
  id: string;
  userId: string;
  contentId?: string;
  kind: string;
  rating?: number;
  createdAt: string;
};

export type DownloadLicense = {
  id: string;
  contentId: string;
  deviceId: string;
  expiresAt: string;
  status: string;
};

export type Rental = {
  id: string;
  contentId: string;
  endsAt: string;
  status: string;
};

export type ExperimentAssignment = {
  experimentId: string;
  variant: string;
};
