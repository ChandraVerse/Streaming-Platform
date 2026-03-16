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
  profiles: Profile[];
  subscription?: {
    status: string;
    planId: string;
  };
};
