import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens.js";

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    email: string;
  };
};

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Missing access token" });
    return;
  }
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = verifyAccessToken(token);
    request.auth = payload;
    next();
  } catch {
    response.status(401).json({ message: "Invalid access token" });
  }
}
