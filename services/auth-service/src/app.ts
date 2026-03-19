import cors from "cors";
import crypto from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { subscriptionRoutes } from "./routes/subscription.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { socialRoutes } from "./routes/social.routes.js";
import { rentalRoutes } from "./routes/rental.routes.js";
import { partnerRoutes } from "./routes/partner.routes.js";

export const app = express();
const metrics = { total: 0, byPath: {} as Record<string, number> };

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use((request, response, next) => {
  const hasCookie = Boolean(request.headers.cookie);
  if (hasCookie && request.method !== "GET") {
    const csrf = request.headers["x-csrf-token"];
    if (!csrf) {
      response.status(403).json({ message: "Missing CSRF token" });
      return;
    }
  }
  next();
});
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120
  })
);
app.use((request, response, next) => {
  const requestId = crypto.randomUUID();
  response.setHeader("x-request-id", requestId);
  const start = Date.now();
  response.on("finish", () => {
    metrics.total += 1;
    metrics.byPath[request.path] = (metrics.byPath[request.path] ?? 0) + 1;
    process.stdout.write(
      JSON.stringify({
        level: "info",
        requestId,
        method: request.method,
        path: request.path,
        status: response.statusCode,
        durationMs: Date.now() - start
      }) + "\n"
    );
  });
  next();
});

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "auth-service" });
});
app.get("/metrics", (_request, response) => {
  response.json({ totalRequests: metrics.total, byPath: metrics.byPath });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/social", socialRoutes);
app.use("/rentals", rentalRoutes);
app.use("/partners", partnerRoutes);
