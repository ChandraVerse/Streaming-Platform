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
