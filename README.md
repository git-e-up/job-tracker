# Job Application Tracker

A full-stack job application tracker built on a serverless AWS stack (React/TypeScript frontend, Node/TypeScript Lambda backend, DynamoDB). Built as a hands-on way to learn AWS/serverless while also solving a real problem: tracking job applications and generating the weekly Texas Workforce Commission (TWC) work search log required for unemployment benefits.

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

Open `http://localhost:5173`. DynamoDB Local persists to `backend/.dynamodb-data/` on disk, so data survives restarts (but only lives on your machine — see Backups below).

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

Two separate stacks — backend (API) and frontend (hosting) deploy independently.

### Backend

```bash
cd backend
npm run deploy   # serverless deploy --stage prod
```

Provisions the DynamoDB table, Lambda functions, and API Gateway (see API access below).

### Frontend hosting (S3 + CloudFront)

`frontend/serverless.yml` is a second, infra-only Serverless service (no functions) that provisions a private S3 bucket plus a CloudFront distribution in front of it — the app is only reachable through CloudFront, not the bucket directly.

```bash
cd frontend
npm run deploy   # builds, provisions/updates the stack, syncs dist/, invalidates the CloudFront cache
```

A brand-new CloudFront distribution takes 10-15 minutes to fully propagate the first time; subsequent deploys (same distribution, just new files + a cache invalidation) are fast.

Before deploying the frontend, copy `.env.production.example` to `.env.production` and fill in the real `VITE_API_BASE`/`VITE_API_KEY` from the backend deploy (see below) — **never commit `.env.production`**, since Vite bakes both values directly into the built JS bundle that ships to the browser.

### API access

Since there are no user accounts, every backend route requires an API Gateway key (`x-api-key` header) once deployed for real, with a usage plan capping requests (throttled + a monthly quota) so an unauthenticated stranger who finds the URL can't spam writes or run up a bill. Locally, `npm run dev` passes `--noAuth` to `serverless-offline`, which skips this check entirely — no key needed for local development.

After deploying the backend, get the generated key with:

```bash
cd backend && npx serverless info --stage prod --verbose
```

and set it as `VITE_API_KEY` in `frontend/.env.production` (alongside `VITE_API_BASE` pointing at the deployed API URL).
