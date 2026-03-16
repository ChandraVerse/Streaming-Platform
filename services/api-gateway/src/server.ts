import cors from "cors";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import helmet from "helmet";
import { env } from "./config.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "api-gateway" });
});

app.use(
  "/api/auth",
  createProxyMiddleware({
    target: env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/users",
  createProxyMiddleware({
    target: env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/subscriptions",
  createProxyMiddleware({
    target: env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/content",
  createProxyMiddleware({
    target: env.CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/search",
  createProxyMiddleware({
    target: env.CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/mux",
  createProxyMiddleware({
    target: env.CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/payments",
  createProxyMiddleware({
    target: env.PAYMENTS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/analytics",
  createProxyMiddleware({
    target: env.ANALYTICS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.listen(env.PORT, () => {
  process.stdout.write(`api-gateway running on port ${env.PORT}\n`);
});
