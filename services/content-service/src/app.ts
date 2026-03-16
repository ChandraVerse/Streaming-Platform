import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { contentRoutes } from "./routes/content.routes.js";
import { searchRoutes } from "./routes/search.routes.js";
import { muxRoutes } from "./routes/mux.routes.js";
import { ratingRoutes } from "./routes/rating.routes.js";

export const app = express();

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

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "content-service" });
});

app.use("/content", contentRoutes);
app.use("/search", searchRoutes);
app.use("/mux", muxRoutes);
app.use("/ratings", ratingRoutes);
