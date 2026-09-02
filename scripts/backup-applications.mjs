#!/usr/bin/env node
// Backs up the job tracker's current data to ~/Documents/TWC/backups/, so
// there's a copy somewhere that isn't just the local DynamoDB Local file on
// this one machine. Requires the backend dev server to be running
// (npm run dev in backend/).
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API_BASE = process.env.API_BASE ?? "http://localhost:4000/local";
const BACKUP_DIR = join(homedir(), "Documents", "TWC", "backups");

const res = await fetch(`${API_BASE}/applications`);
if (!res.ok) {
  console.error(`Failed to fetch applications (${res.status}). Is the backend running? (npm run dev in backend/)`);
  process.exit(1);
}
const applications = await res.json();

mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = join(BACKUP_DIR, `applications-backup-${timestamp}.json`);
writeFileSync(outPath, JSON.stringify(applications, null, 2));

console.log(`Backed up ${applications.length} application(s) to ${outPath}`);
