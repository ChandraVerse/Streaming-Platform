import { exec } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(exec);

async function backup() {
  const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/unified-ott";
  const output = process.env.BACKUP_DIR ?? "./backups";
  await run(`mongodump --uri="${mongoUri}" --out="${output}"`);
  process.stdout.write(`Backup stored in ${output}\n`);
}

backup().catch((error) => {
  process.stderr.write(`Backup failed: ${String(error)}\n`);
  process.exit(1);
});
