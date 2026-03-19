import cors from "cors";
import crypto from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { contentRoutes } from "./routes/content.routes.js";
import { searchRoutes } from "./routes/search.routes.js";
import { muxRoutes } from "./routes/mux.routes.js";
import { ratingRoutes } from "./routes/rating.routes.js";
import { liveRoutes } from "./routes/live.routes.js";
import { adsRoutes } from "./routes/ads.routes.js";
import { downloadsRoutes } from "./routes/downloads.routes.js";
import { campaignsRoutes } from "./routes/campaigns.routes.js";

export const app = express();
const metrics = { total: 0, byPath: {} as Record<string, number> };

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
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
  response.json({ status: "ok", service: "content-service" });
});
app.get("/metrics", (_request, response) => {
  response.json({ totalRequests: metrics.total, byPath: metrics.byPath });
});

app.use("/content", contentRoutes);
app.use("/search", searchRoutes);
app.use("/mux", muxRoutes);
app.use("/ratings", ratingRoutes);
app.use("/live", liveRoutes);
app.use("/ads", adsRoutes);
app.use("/downloads", downloadsRoutes);
app.use("/campaigns", campaignsRoutes);
