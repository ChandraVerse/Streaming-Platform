import cors from "cors";
import crypto from "crypto";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import helmet from "helmet";
import { env } from "./config.js";

const app = express();
const metrics = { total: 0, byPath: {} as Record<string, number> };

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
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
  response.json({ status: "ok", service: "api-gateway" });
});
app.get("/metrics", (_request, response) => {
  response.json({ totalRequests: metrics.total, byPath: metrics.byPath });
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
  "/api/ratings",
  createProxyMiddleware({
    target: env.CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/live",
  createProxyMiddleware({
    target: env.CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/ads",
  createProxyMiddleware({
    target: env.CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/downloads",
  createProxyMiddleware({
    target: env.CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/campaigns",
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

app.use(
  "/api/rentals",
  createProxyMiddleware({
    target: env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.use(
  "/api/partners",
  createProxyMiddleware({
    target: env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  })
);

app.listen(env.PORT, () => {
  process.stdout.write(`api-gateway running on port ${env.PORT}\n`);
});
