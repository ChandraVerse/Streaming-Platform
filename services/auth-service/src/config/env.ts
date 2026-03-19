import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4001),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/unified-ott"),
  JWT_ACCESS_SECRET: z.string().min(8).default("access-secret-key"),
  JWT_REFRESH_SECRET: z.string().min(8).default("refresh-secret-key"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  ADMIN_API_SECRET: z.string().min(8).default("admin-secret-key"),
  INTERNAL_API_SECRET: z.string().min(8).default("internal-secret-key"),
  PAYMENTS_WEBHOOK_SECRET: z.string().min(8).default("payments-secret-key"),
  ANALYTICS_SERVICE_URL: z.string().url().default("http://localhost:4004")
});

export const env = envSchema.parse(process.env);
