#!/usr/bin/env node
// Wraps `serverless offline start` so local dev data survives restarts
// without DynamoDB Local's buggy file-persisted (dbPath) storage mode: seeds
// the in-memory table from .dynamodb-data/snapshot.json on start, and saves
// back to it on shutdown (Ctrl+C). See serverless.yml for why inMemory:true.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
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

seedOnceReady();
