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
  const user = await UserModel.create({
    fullName,
    email,
    passwordHash,
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

export const authRoutes = router;
