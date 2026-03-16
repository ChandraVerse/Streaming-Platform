import { Schema, model } from "mongoose";

type Profile = {
  _id?: Schema.Types.ObjectId;
  name: string;
  isKids: boolean;
};

export type UserDocument = {
  fullName: string;
  email: string;
  passwordHash: string;
  oauthProviders: {
    googleId?: string;
    facebookId?: string;
  };
  profiles: Profile[];
  refreshToken?: string;
  emailVerified: boolean;
  otpCode?: string;
  otpExpiresAt?: Date;
   referralCode: string;
  referralCount: number;
  createdAt: Date;
  updatedAt: Date;
};

const profileSchema = new Schema<Profile>(
  {
    name: { type: String, required: true },
    isKids: { type: Boolean, default: false }
  },
  { _id: true }
);

const userSchema = new Schema<UserDocument>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    oauthProviders: {
      googleId: { type: String },
      facebookId: { type: String }
    },
    profiles: { type: [profileSchema], default: [] },
    refreshToken: { type: String },
    emailVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    referralCode: { type: String, unique: true },
    referralCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", userSchema);
