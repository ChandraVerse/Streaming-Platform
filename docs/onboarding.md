# Developer Onboarding

## Prerequisites

- Node.js 22
- Docker (for MongoDB and Elasticsearch)

## Install

```bash
npm install
```

## Run locally

```bash
docker compose up -d
npm run dev:api
npm run dev:auth
npm run dev:frontend
```

## Tests

```bash
npm run lint
npm run typecheck
npm run test
```

## Seed data

```bash
npm --workspace services/content-service run dev
npm --workspace services/auth-service run dev
```

Then run:

```bash
npm --workspace services/content-service run tsx src/scripts/seed.ts
npm --workspace services/auth-service run tsx src/scripts/seed.ts
```
