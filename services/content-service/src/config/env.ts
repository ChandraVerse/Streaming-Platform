import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4002),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/unified-ott"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  ELASTICSEARCH_URL: z.string().url().default("http://localhost:9200"),
  MUX_TOKEN_ID: z.string().optional(),
  MUX_TOKEN_SECRET: z.string().optional(),
  ANALYTICS_SERVICE_URL: z.string().url().default("http://localhost:4004"),
  DOWNLOAD_SIGNING_SECRET: z.string().min(16).default("download-signing-secret")
});

export const env = envSchema.parse(process.env);
