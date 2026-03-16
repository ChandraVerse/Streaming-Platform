import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserModel } from "../models/user.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens.js";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const otpRequestSchema = z.object({
  email: z.string().email()
});

const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8)
});

const oauthSchema = z.object({
  provider: z.enum(["google", "facebook"]),
  providerId: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1)
});

router.post("/register", async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const { fullName, email, password } = parsed.data;
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    response.status(409).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const referralCode = `${email.split("@")[0]}-${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
  const user = await UserModel.create({
    fullName,
    email,
    passwordHash,
    referralCode,
    profiles: [{ name: "Main Profile", isKids: false }]
  });

  response.status(201).json({
    message: "Account created",
    data: { userId: user.id, email: user.email }
  });
});

router.post("/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const user = await UserModel.findOne({ email });
  if (!user) {
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const tokenPayload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  user.refreshToken = refreshToken;
  await user.save();

  response.json({
    message: "Login successful",
    data: {
      accessToken,
      refreshToken
    }
  });
});

router.post("/request-otp", async (request, response) => {
  const parsed = otpRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const email = parsed.data.email;
  const user =
    (await UserModel.findOne({ email })) ??
    (await UserModel.create({
      fullName: email,
      email,
      passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
      referralCode: `${email.split("@")[0]}-${Math.random().toString(36).slice(2, 8)}`.toLowerCase(),
      profiles: [{ name: "Main Profile", isKids: false }]
    }));

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.otpCode = code;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  response.json({
    message: "OTP generated",
    data: {
      email,
      code
    }
  });
});

router.post("/verify-otp", async (request, response) => {
  const parsed = otpVerifySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const { email, code } = parsed.data;
  const user = await UserModel.findOne({ email });
  if (!user || !user.otpCode || !user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now() || user.otpCode !== code) {
    response.status(401).json({ message: "Invalid or expired OTP" });
    return;
  }

  user.emailVerified = true;
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  const tokenPayload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  user.refreshToken = refreshToken;
  await user.save();

  response.json({
    message: "OTP verified",
    data: {
      accessToken,
      refreshToken
    }
  });
});

router.post("/oauth", async (request, response) => {
  const parsed = oauthSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const { provider, providerId, email, fullName } = parsed.data;
  const query: Record<string, unknown> = { email };
  query[`oauthProviders.${provider}Id`] = providerId;

  let user = await UserModel.findOne(query);
  if (!user) {
    user = await UserModel.findOne({ email });
  }

  if (!user) {
    user = await UserModel.create({
      fullName,
      email,
      passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
      oauthProviders: { [`${provider}Id`]: providerId } as never,
      referralCode: `${email.split("@")[0]}-${Math.random().toString(36).slice(2, 8)}`.toLowerCase(),
      profiles: [{ name: "Main Profile", isKids: false }],
      emailVerified: true
    });
  } else {
    user.oauthProviders[`${provider}Id` as "googleId" | "facebookId"] = providerId;
    user.emailVerified = true;
    await user.save();
  }

  const tokenPayload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  user.refreshToken = refreshToken;
  await user.save();

  response.json({
    message: "OAuth login successful",
    data: {
      accessToken,
      refreshToken
    }
  });
});

export const authRoutes = router;
