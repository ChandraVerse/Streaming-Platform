import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4004),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/unified-ott"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  AUTH_SERVICE_URL: z.string().url().default("http://localhost:4001"),
  INTERNAL_API_SECRET: z.string().min(8).default("internal-secret-key")
});

export const env = envSchema.parse(process.env);
