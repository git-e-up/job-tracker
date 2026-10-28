#!/usr/bin/env node
// Wraps `serverless offline start` so local dev data survives restarts
// without DynamoDB Local's buggy file-persisted (dbPath) storage mode: seeds
// the in-memory table from .dynamodb-data/snapshot.json on start, and saves
// back to it on shutdown (Ctrl+C). See serverless.yml for why inMemory:true.
//
// A shutdown-only save isn't enough on its own: a closed terminal window,
// laptop sleep, or crash all skip it, silently discarding everything back to
// the last graceful stop. AUTOSAVE_INTERVAL_MS below also saves periodically
// so an ungraceful end loses at most one interval's worth of work.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const slsBin = path.join(backendRoot, "node_modules", ".bin", "serverless");

// Force the same Node binary running this script (not whatever `node` PATH
// resolves to, which may be a different/older version — serverless's own
// dependencies can fail to load under one).
const nodeDir = path.dirname(process.execPath);
const childEnv = { ...process.env, PATH: `${nodeDir}:${process.env.PATH}` };

// detached so Ctrl+C (SIGINT to the terminal's foreground process group)
// doesn't also hit this child directly — we need it to stay alive long
// enough for the pre-shutdown snapshot save below to scan it.
const child = spawn(slsBin, ["offline", "start", "--stage", "local", "--noAuth"], {
  cwd: backendRoot,
  stdio: "inherit",
  detached: true,
  env: childEnv,
});

let shuttingDown = false;

async function seedOnceReady() {
  const { run } = await import("./seed.mjs");
  try {
    await run();
  } catch (err) {
    console.error("[dev] Seed failed:", err.message);
  }
}

let autosaveTimer;

function startAutosave() {
  autosaveTimer = setInterval(async () => {
    if (shuttingDown) return;
    try {
      const { run } = await import("./snapshot.mjs");
      await run();
    } catch (err) {
      console.error("[dev] Autosave failed:", err.message);
    }
  }, AUTOSAVE_INTERVAL_MS);
  autosaveTimer.unref();
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(autosaveTimer);
  console.log(`\n[dev] Caught ${signal}, saving snapshot before shutdown...`);
  try {
    const { run } = await import("./snapshot.mjs");
    await run();
  } catch (err) {
    console.error("[dev] Snapshot save failed:", err.message);
  }
  if (child.pid) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
  setTimeout(() => process.exit(0), 1000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

child.on("exit", (code) => {
  if (!shuttingDown) process.exit(code ?? 0);
});

// Sequenced (not fire-and-forget) so autosave's first Scan can't race ahead
// of seeding and overwrite snapshot.json with an incomplete table.
seedOnceReady().then(startAutosave);
