#!/usr/bin/env node
// Seeds the demo DynamoDB table directly (the demo API has no write route
// at all, so this writes straight to DynamoDB using your own AWS
// credentials — this is an admin/deploy-time operation, not something the
// public demo can trigger).
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

const TABLE_NAME = "applications-demo";
const client = new DynamoDBClient({ region: "us-east-1" });
const ddb = DynamoDBDocumentClient.from(client);

const now = () => new Date().toISOString();

const seedApplications = [
  {
    company: "Acme Robotics",
    role: "Frontend Engineer",
    status: "applied",
    activity: "Applied online",
    dateApplied: "2026-08-20",
    employerCityStateZip: "Austin, TX",
  },
  {
    company: "Globex Software",
    role: "Full Stack Developer",
    status: "interview",
    activity: "Phone interview",
    dateApplied: "2026-08-24",
    employerCityStateZip: "Remote",
  },
  {
    company: "Initech",
    role: "Backend Engineer",
    status: "rejected",
    activity: "Applied online",
    dateApplied: "2026-08-18",
    employerCityStateZip: "Austin, TX",
  },
  {
    company: "Hooli",
    role: "Senior Software Engineer",
    status: "offer",
    activity: "Final round interview",
    dateApplied: "2026-08-12",
    employerCityStateZip: "San Francisco, CA",
  },
  {
    company: "Stark Industries",
    role: "React Developer",
    status: "phone_screen",
    activity: "Applied via referral",
    dateApplied: "2026-08-28",
    employerCityStateZip: "Remote",
  },
  {
    company: "Wayne Enterprises",
    role: "Platform Engineer",
    status: "other",
    activity: "Attended virtual job fair",
    dateApplied: "2026-08-15",
    employerCityStateZip: "Gotham, NJ",
  },
];

async function main() {
  const existing = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
  if ((existing.Items?.length ?? 0) > 0) {
    console.log(`${TABLE_NAME} already has ${existing.Items.length} item(s) — refusing to double-seed.`);
    console.log("Delete existing items first if you want to reseed from scratch.");
    process.exit(1);
  }

  for (const app of seedApplications) {
    const item = {
      id: randomUUID(),
      company: app.company,
      role: app.role,
      status: app.status,
      dateApplied: app.dateApplied,
      lastUpdated: now(),
      url: "",
      notes: "",
      activity: app.activity,
      employerAddress: "",
      employerCityStateZip: app.employerCityStateZip ?? "",
      employerPhone: "",
      contactMethod: "none",
      contactValue: "",
      personContacted: "",
    };
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    console.log(`Seeded: ${item.company} — ${item.role}`);
  }

  console.log(`\nDone. ${seedApplications.length} item(s) seeded to ${TABLE_NAME}.`);
}

main();
