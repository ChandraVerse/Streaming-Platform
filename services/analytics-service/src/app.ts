import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { analyticsRoutes } from "./routes/analytics.routes.js";

export const app = express();

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

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "analytics-service" });
});

app.use("/analytics", analyticsRoutes);

