import cors from "cors";
import crypto from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { analyticsRoutes } from "./routes/analytics.routes.js";

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
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 240
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
  response.json({ status: "ok", service: "analytics-service" });
});
app.get("/metrics", (_request, response) => {
  response.json({ totalRequests: metrics.total, byPath: metrics.byPath });
});

app.use("/analytics", analyticsRoutes);
