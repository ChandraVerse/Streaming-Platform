import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { subscriptionRoutes } from "./routes/subscription.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { socialRoutes } from "./routes/social.routes.js";

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
    limit: 120
  })
);

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "auth-service" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/social", socialRoutes);
