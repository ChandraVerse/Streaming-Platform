async function check(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Health check failed for ${url}`);
  }
}

async function run() {
  const base = process.env.ALERT_BASE_URL ?? "http://localhost:4000";
  await check(`${base}/health`);
  process.stdout.write("All services healthy\n");
}

run().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
