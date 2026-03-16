import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  process.stdout.write(`payments-service running on port ${env.PORT}\n`);
});

