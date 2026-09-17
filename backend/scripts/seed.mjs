#!/usr/bin/env node
// Restores .dynamodb-data/snapshot.json (written by snapshot.mjs) into the
// local (in-memory) DynamoDB table. Run automatically by scripts/dev.mjs
// right after serverless-offline starts. A missing snapshot file (e.g. the
// very first run) just means starting empty.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { TABLE_NAME, getClient, retryUntilReady } from "./lib/table.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(__dirname, "..", ".dynamodb-data", "snapshot.json");

export async function run() {
  if (!existsSync(SNAPSHOT_PATH)) {
    console.log("[seed] No snapshot found, starting with an empty table.");
    return 0;
  }

  const items = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf-8"));
  const ddb = getClient();

  await retryUntilReady(() =>
    Promise.all(
      items.map((item) => ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item })))
    )
  );

  console.log(`[seed] Restored ${items.length} application(s) from ${SNAPSHOT_PATH}`);
  return items.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    console.error("[seed] Failed:", err.message);
    process.exit(1);
  });
}
