import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { UserModel } from "../models/user.model.js";
import { DeviceSessionModel } from "../models/device-session.model.js";
import { DeviceCodeModel } from "../models/device-code.model.js";
import { AuditLogModel } from "../models/audit-log.model.js";
import { env } from "../config/env.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().max(320),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128)
});

const otpRequestSchema = z.object({
  email: z.string().email().max(320)
});

const otpVerifySchema = z.object({
  email: z.string().email().max(320),
  code: z.string().min(4).max(8)
});

const oauthSchema = z.object({
  provider: z.enum(["google", "facebook"]),
  providerId: z.string().min(1),
  email: z.string().email().max(320),
  fullName: z.string().min(1).max(80)
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5
});

function getFingerprint(request: { headers: Record<string, unknown>; ip: string }) {
  const userAgent = String(request.headers["user-agent"] ?? "");
  const accept = String(request.headers["accept"] ?? "");
  const raw = `${request.ip}|${userAgent}|${accept}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function upsertDeviceSession(userId: string, request: { headers: Record<string, unknown>; ip: string }) {
  const fingerprint = getFingerprint(request);
  const userAgent = String(request.headers["user-agent"] ?? "");
  const ip = request.ip;
  const existing = await DeviceSessionModel.findOne({ userId, fingerprint });
  if (existing) {
    existing.lastSeenAt = new Date();
    await existing.save();
    return { fingerprint, isNew: false };
  }
  const count = await DeviceSessionModel.countDocuments({ userId });
  if (count >= 5) {
    await AuditLogModel.create({
      actorId: userId,
      action: "suspicious_device_limit",
      metadata: { ip, userAgent }
    });
  }
  await DeviceSessionModel.create({
    userId,
    fingerprint,
    ip,
    userAgent,
    lastSeenAt: new Date()
  });
  return { fingerprint, isNew: true };
}

router.post("/register", authLimiter, async (request, response) => {
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
  try {
    await fetch(`${env.ANALYTICS_SERVICE_URL}/analytics/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user.id,
        kind: "signup"
      })
    });
  } catch {
  }

  response.status(201).json({
    message: "Account created",
    data: { userId: user.id, email: user.email }
  });
});

router.post("/login", authLimiter, async (request, response) => {
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
  await upsertDeviceSession(user.id, request);

  response.json({
    message: "Login successful",
    data: {
      accessToken,
      refreshToken
    }
  });
});

router.post("/request-otp", otpLimiter, async (request, response) => {
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

router.post("/verify-otp", otpLimiter, async (request, response) => {
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
  await upsertDeviceSession(user.id, request);

  response.json({
    message: "OTP verified",
    data: {
      accessToken,
      refreshToken
    }
  });
});

router.post("/oauth", authLimiter, async (request, response) => {
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
  await upsertDeviceSession(user.id, request);

  response.json({
    message: "OAuth login successful",
    data: {
      accessToken,
      refreshToken
    }
  });
});

router.post("/refresh", async (request, response) => {
  const schema = z.object({ refreshToken: z.string().min(1) });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const user = await UserModel.findById(payload.userId);
    if (!user || user.refreshToken !== parsed.data.refreshToken) {
      response.status(401).json({ message: "Invalid refresh token" });
      return;
    }
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    response.json({ data: { accessToken } });
  } catch {
    response.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/device/code", async (_request, response) => {
  const deviceCode = crypto.randomBytes(16).toString("hex");
  const userCode = crypto.randomBytes(3).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await DeviceCodeModel.create({
    deviceCode,
    userCode,
    expiresAt
  });
  response.status(201).json({
    data: {
      deviceCode,
      userCode,
      expiresAt
    }
  });
});

router.post("/device/verify", requireAuth, async (request: AuthenticatedRequest, response) => {
  const schema = z.object({ userCode: z.string().min(1) });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const userId = request.auth?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
  const device = await DeviceCodeModel.findOne({ userCode: parsed.data.userCode, status: "pending" });
  if (!device || device.expiresAt.getTime() < Date.now()) {
    response.status(404).json({ message: "Device code expired" });
    return;
  }
  device.userId = userId;
  device.status = "approved";
  await device.save();
  response.json({ message: "Device approved" });
});

router.post("/device/token", async (request, response) => {
  const schema = z.object({ deviceCode: z.string().min(1) });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const device = await DeviceCodeModel.findOne({ deviceCode: parsed.data.deviceCode });
  if (!device || device.expiresAt.getTime() < Date.now()) {
    response.status(404).json({ message: "Device code expired" });
    return;
  }
  if (device.status !== "approved" || !device.userId) {
    response.status(202).json({ message: "Authorization pending" });
    return;
  }
  const user = await UserModel.findById(device.userId);
  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
  user.refreshToken = refreshToken;
  await user.save();
  response.json({
    data: {
      accessToken,
      refreshToken
    }
  });
});

export const authRoutes = router;
