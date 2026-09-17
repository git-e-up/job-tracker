# Job Application Tracker

A full-stack job application tracker built on a serverless AWS stack (React/TypeScript frontend, Node/TypeScript Lambda backend, DynamoDB). Built as a hands-on way to learn AWS/serverless while also solving a real problem: tracking job applications and generating the weekly Texas Workforce Commission (TWC) work search log required for unemployment benefits.

**Live demo**: https://dkwcmd4fdt61i.cloudfront.net — read-only, seeded with fake sample data (see [Deployment](#deployment) for why).

## Features

- Track applications: company, role, status, dates, notes
- Extra fields for TWC compliance: work search activity description, employer address/phone, contact method, person contacted
- One-click **TWC PDF export** — fills the real TWC "Work Search Activity Log" (form BN900E) for a given week directly from your tracked applications, entirely in the browser (no server round-trip, no personal data ever leaves your machine). Claimant name and SSN are intentionally left blank in the generated PDF so they can be filled in afterward in any PDF reader.
- Runs entirely locally against DynamoDB Local during development — no AWS account needed to build or test

## Tech stack

- **Frontend**: React + TypeScript + Vite, [pdf-lib](https://pdf-lib.js.org/) for client-side PDF form filling
- **Backend**: Node/TypeScript Lambda functions via the [Serverless Framework](https://www.serverless.com/) (v3), DynamoDB
- **Local dev**: [serverless-offline](https://github.com/dherault/serverless-offline) + [serverless-dynamodb](https://github.com/raisenational/serverless-dynamodb) (DynamoDB Local)
- **Testing**: [Vitest](https://vitest.dev/) on both frontend and backend

## Dependency security

This project pins Serverless Framework to v3, which carries known transitive vulnerabilities in its CLI dependencies (`tar`, `decompress`, `adm-zip`, etc.). These are present only in deploy-time CLI tooling, not in the deployed runtime — they never reach the Lambda bundle or the built frontend — so they've been reviewed and dismissed on GitHub as not applicable; one independently-fixable finding (`esbuild`) was patched directly. Upgrading to Serverless Framework v4 would resolve the rest, but requires a paid account login and forces a coupled upgrade of `serverless-offline`, `serverless-dynamodb`, and `serverless-esbuild` — not worth the added external dependency and migration risk (particularly to `serverless-dynamodb`, which backs real local TWC data) for a personal project.

## Project structure

```
backend/    Lambda handlers, DynamoDB table definition, Serverless config
frontend/   React app, TWC PDF export logic, blank BN900E template
scripts/    Standalone utility scripts (see Backups below)
```

## Local development

### Prerequisites

- **Node 20** (see `.nvmrc`; the repo was built against Node 20 via [nvm](https://github.com/nvm-sh/nvm))
- **Java** (required by DynamoDB Local) — e.g. `brew install openjdk`
- **Homebrew** if you don't already have it, for installing Java

### Setup

```bash
# Backend
cd backend
npm install
npm run dev        # starts serverless-offline + DynamoDB Local on :4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev         # starts Vite on :5173
```

Open `http://localhost:5173`. `npm run dev` runs DynamoDB Local in-memory (its file-backed storage mode has a [known bug](https://github.com/aaronshaf/dynamodb-admin/issues/105) where `UpdateItem` can silently duplicate a row instead of updating it in place, eventually corrupting that record). `backend/scripts/dev.mjs` wraps `serverless offline start` to restore data from `backend/.dynamodb-data/snapshot.json` on startup and save back to it on shutdown (Ctrl+C), so data still survives restarts without that bug. Data only lives on your machine — see Backups below — and `npm run save` snapshots mid-session as a safety net (e.g. before a crash, which skips the on-shutdown save).

### Tests

```bash
cd backend && npm test
cd frontend && npm test
```

### Type-checking

The frontend's root `tsconfig.json` is a solution-style config (`references`, no direct `include`) — use `npx tsc --build` rather than a bare `tsc --noEmit`, which would silently check nothing.

## TWC PDF export

In the app, pick a **week-ending Saturday** and click **Download TWC PDF**. It pulls that week's applications, maps each one's status to the form's result checkboxes (`applied` → Application filed, `rejected` → also Not hiring, etc.), and fills `frontend/public/bn900e-blank.pdf` — a genuine blank copy of TWC form BN900E — using pdf-lib, entirely client-side.

If more than 5 applications fall in one week, the form doesn't fit on a single page (the paper form itself says "make as many copies as you need"), so the export downloads one filled PDF per page rather than merging them into one file.

## Backups

DynamoDB Local's on-disk data only exists on this one machine, with no redundancy. Until this is deployed to real AWS (which gives you proper DynamoDB durability), back it up manually:

```bash
node scripts/backup-applications.mjs
```

Requires the backend dev server to be running. Writes a timestamped JSON snapshot to `~/Documents/TWC/backups/`.

## Deployment

There's no user-account system, so "deploy the full read/write app publicly" and "deploy something safe to share" are two different things. This repo supports both, deployed independently:

- **`prod`** — the full CRUD API (`backend/serverless.yml`), API-key gated. **Not currently deployed.** An API key embedded in a client-side app is a deterrent against casual bots, not real access control — anyone who opens dev tools on a page using it can read the key out of the JS bundle and call the write routes directly. Real personal use of this deployment should wait until it has actual auth in front of it; until then it's meant to be run without a public frontend pointed at it (e.g. built and used locally against the deployed API), not linked from anywhere.
- **`demo`** — a separate, genuinely read-only backend (`backend/serverless.demo.yml`) seeded with fake data, safe to link publicly. This is what the live CloudFront URL actually serves.

### Demo (what's actually live)

`backend/serverless.demo.yml` only declares the `listApplications` function — there is no create/update/delete route in this API Gateway deployment at all, and its Lambda's IAM role only grants `dynamodb:Scan`. That's a structural guarantee, not a client-side one: no key to extract, because there's nothing behind it to unlock.

```bash
# Backend: deploy the read-only API + seed fake data (one-time, or after a reseed)
cd backend
npx serverless deploy --config serverless.demo.yml
node scripts/seed-demo.mjs      # refuses to run if the table already has data

# Frontend: build in read-only mode and push to the existing hosting stack
cd frontend
npm run deploy:demo
```

`frontend/.env.demo` holds the demo API URL and `VITE_READ_ONLY=true` (which hides Add/Edit/Delete in the UI). It has no secret in it — the demo API needs no key — so unlike `.env.production` it's safe to commit.

### Full CRUD backend (`prod`) — for future real use, once it has real auth

```bash
cd backend
npm run deploy   # serverless deploy --stage prod
```

Provisions the DynamoDB table, Lambda functions, and API Gateway, with an API Gateway key + usage plan (throttled + a monthly quota) gating every route — see the note above on what that does and doesn't protect against. Get the generated key with:

```bash
npx serverless info --stage prod --verbose
```

To point a frontend build at it: copy `.env.production.example` to `.env.production`, fill in the real `VITE_API_BASE`/`VITE_API_KEY` — **never commit `.env.production`**, since Vite bakes both values directly into the built JS bundle. Locally, `npm run dev` passes `--noAuth` to `serverless-offline`, so no key is needed for local development regardless.

### Frontend hosting (S3 + CloudFront)

`frontend/serverless.yml` is a third, infra-only Serverless service (no functions) that provisions a private S3 bucket plus a CloudFront distribution in front of it — the app is only reachable through CloudFront, not the bucket directly. This same hosting stack serves whichever build was most recently synced to it (`npm run deploy` for the full app, `npm run deploy:demo` for the read-only one).

```bash
cd frontend
npm run deploy   # builds (.env.production), provisions/updates the stack, syncs dist/, invalidates the cache
```

A brand-new CloudFront distribution can take 10-15 minutes to fully propagate the first time; subsequent deploys (same distribution, just new files + a cache invalidation) are fast.
