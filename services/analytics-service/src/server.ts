import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDatabase();
  app.listen(env.PORT, () => {
    process.stdout.write(`analytics-service running on port ${env.PORT}\n`);
  });
}

bootstrap().catch((error) => {
  process.stderr.write(`Failed to start analytics-service: ${String(error)}\n`);
  process.exit(1);
});

