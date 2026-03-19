const { spawnSync } = require("child_process");

const shouldRun = process.env.CYPRESS_RUN === "true";

if (!shouldRun) {
  process.stdout.write("Skipping Cypress. Set CYPRESS_RUN=true to run.\n");
  process.exit(0);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["cypress", "run"], { stdio: "inherit" });
process.exit(result.status ?? 1);
