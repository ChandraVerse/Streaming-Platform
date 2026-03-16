import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  AUTH_SERVICE_URL: z.string().url().default("http://localhost:4001"),
  CONTENT_SERVICE_URL: z.string().url().default("http://localhost:4002"),
  PAYMENTS_SERVICE_URL: z.string().url().default("http://localhost:4003"),
  ANALYTICS_SERVICE_URL: z.string().url().default("http://localhost:4004")
});

export const env = envSchema.parse(process.env);
