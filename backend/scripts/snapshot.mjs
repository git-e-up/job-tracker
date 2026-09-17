#!/usr/bin/env node
// Saves the current contents of the local (in-memory) DynamoDB table to
// .dynamodb-data/snapshot.json, so seed.mjs can restore it on the next
// `npm run dev`. Run automatically by scripts/dev.mjs on shutdown; can also
// be run manually (`npm run save`) as a safety net mid-session.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TABLE_NAME, getClient } from "./lib/table.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(__dirname, "..", ".dynamodb-data", "snapshot.json");

export async function run() {
  const ddb = getClient();
  const items = [];
  let ExclusiveStartKey;
  do {
    const result = await ddb.send(
      new ScanCommand({ TableName: TABLE_NAME, ExclusiveStartKey })
    );
    items.push(...(result.Items ?? []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(items, null, 2));
  console.log(`[snapshot] Saved ${items.length} application(s) to ${SNAPSHOT_PATH}`);
  return items.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    console.error("[snapshot] Failed:", err.message);
    process.exit(1);
  });
}
